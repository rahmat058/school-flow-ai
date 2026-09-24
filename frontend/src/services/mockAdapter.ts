import { AxiosError } from 'axios'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type { AuthSession, AuthUser, OtpChallenge } from '@/types/auth'
import type { ClassOption } from '@/types/academic'
import type {
  ClassFeeStatusRow,
  ClassReportRow,
  Concession,
  ConcessionCategory,
  ConcessionRow,
  ConcessionType,
  DayBook,
  DayBookRow,
  DefaulterRow,
  FeeChartPoint,
  FeeCollectSummary,
  FeeCollectionSummary,
  FeeDashboard,
  FeeHead,
  FeeHeadRow,
  FeeInvoice,
  FeeInvoiceListItem,
  FeePayment,
  FeeStructureDetail,
  FeeTrendPoint,
  InvoiceCandidateRow,
  InvoiceStatus,
  PaymentHistoryRow,
  PaymentMethod,
  Receipt,
  StudentCollectSummary,
  StudentDueRow,
  StudentLedger,
  StudentLedgerRow,
} from '@/types/fees'
import type { ChatMessageListItem, ConversationListItem, Notice, NoticePriority } from '@/types/communication'
import type { PermissionGroupRow, StaffPermissionRow, UserPermissions } from '@/types/permission'
import type { AiConversation, AiGeneration } from '@/types/ai'
import type {
  Exam,
  ExamKind,
  ExamListItem,
  ExamStatus,
  ExamSubjectRow,
  ExamType,
  ResultSheet,
  TestListItem,
} from '@/types/exams'
import type { Homework, HomeworkListItem } from '@/types/homework'
import type {
  ClassTimetable,
  MyTimetable,
  Period,
  TeacherTimetableDay,
  Timetable,
  TimetableDay,
  TimetablePeriodRow,
  Weekday,
} from '@/types/timetable'
import type {
  BloodGroup,
  Guardian,
  StudentAttendance,
  StudentDocument,
  StudentFees,
  StudentListItem,
  StudentMarkRow,
  StudentProfile,
  StudentResults,
  Student,
  Teacher,
  TeacherListItem,
  Gender,
} from '@/types/people'
import { ACADEMIC_YEAR, DEMO_PASSWORD, SCHOOL_DOMAIN, SCHOOL_ID, dateOffset, schoolEmail } from '@/data/seed'
import { activeSchool } from '@/data/school'
import { classLabel, classes } from '@/data/classes'
import { findTeacher, teachers, teacherClasses } from '@/data/teachers'
import { examResults, examSubjects, exams, maxMarks, reportCards } from '@/data/exams'
import { gradeForPercentage } from '@/lib/grades'
import { findSubject, subjects } from '@/data/subjects'
import {
  concessions,
  feeHeads,
  feeInvoices,
  feePayments,
  feeStructures,
  findFeeHead,
  findFeeInvoice,
  headsForStructure,
  structureForClass,
} from '@/data/fees'
import { formatPaise, humanizeEnum } from '@/lib/format'
import { NOTICE_PRIORITY_VALUES } from '@/lib/options'
import { findStudent, students } from '@/data/students'
import { attendance } from '@/data/attendance'
import { parents, parentStudents } from '@/data/parents'
import { notices } from '@/data/notices'
import { conversations, messages } from '@/data/chat'
import { permissions, userPermissions } from '@/data/permissions'
import { homework, homeworkSubmissions } from '@/data/homework'
import { periods, timetables, weekdays } from '@/data/timetable'
import { dashboardSummary } from '@/data/dashboard'
import { demoAccounts, users } from '@/data/users'
import { aiConversations } from '@/data/ai'

/**
 * Demo API. Answers requests from `src/data/*` with the real response envelope and realistic
 * latency, so the axios interceptors, TanStack Query hooks and components all run the same code path
 * they will use against the NestJS backend. Disable with `VITE_ENABLE_MOCKS=false`.
 *
 * Delete this file once the backend exists — nothing else changes.
 */

const OTP_CODE = '123456'
const REFRESH_KEY = 'school-flow.demo-refresh-user'

// ---------------------------------------------------------------------------------------------
// session shim: stands in for the httpOnly refresh cookie (browsers) or module memory (Node)
// ---------------------------------------------------------------------------------------------
const memoryStore = new Map<string, string>()

/** Browsers have sessionStorage; Node (the integration test) does not — fall back to memory. */
function browserStorage(): Storage | null {
  try {
    return typeof globalThis.sessionStorage === 'undefined' ? null : globalThis.sessionStorage
  } catch {
    return null
  }
}

const sessionShim = {
  get(key: string): string | null {
    const storage = browserStorage()
    return storage ? storage.getItem(key) : (memoryStore.get(key) ?? null)
  },
  set(key: string, value: string): void {
    const storage = browserStorage()
    if (storage) storage.setItem(key, value)
    else memoryStore.set(key, value)
  },
  remove(key: string): void {
    const storage = browserStorage()
    if (storage) storage.removeItem(key)
    else memoryStore.delete(key)
  },
}

// ---------------------------------------------------------------------------------------------
// request/response plumbing
// ---------------------------------------------------------------------------------------------
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface MockRequest {
  method: HttpMethod
  path: string
  body: Record<string, unknown>
  params: Record<string, unknown>
  userId: string | null
}

interface MockResult {
  status: number
  body: unknown
}

type RouteHandler = (request: MockRequest) => MockResult

interface Route {
  method: HttpMethod
  path: string
  handler: RouteHandler
}

function ok<T>(data: T, meta?: PaginationMeta): MockResult {
  const envelope: ApiEnvelope<T> = meta ? { success: true, data, meta } : { success: true, data }
  return { status: 200, body: envelope }
}

function created<T>(data: T): MockResult {
  return { status: 201, body: { success: true, data } }
}

function fail(status: number, code: string, message: string, details?: string[]): MockResult {
  return { status, body: { success: false, error: { code, message, ...(details ? { details } : {}) } } }
}

function normalizePath(config: InternalAxiosRequestConfig): string {
  let path = config.url ?? ''
  const base = config.baseURL ?? ''
  if (base && path.startsWith(base)) path = path.slice(base.length)
  if (!path.startsWith('/')) path = `/${path}`
  return path.replace(/\/+$/, '') || '/'
}

function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  const { data } = config
  if (!data) return {}
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return data as Record<string, unknown>
}

function readToken(config: InternalAxiosRequestConfig): string | null {
  const headers = config.headers as unknown as { get?: (name: string) => string | null }
  const raw = headers?.get?.('Authorization') ?? null
  if (!raw?.startsWith('Bearer ')) return null
  return raw.slice('Bearer '.length)
}

/** Separator is `.` because user ids contain underscores (`usr_admin_1`). */
function userIdFromToken(token: string | null): string | null {
  if (!token?.startsWith('token.')) return null
  const parts = token.split('.')
  return parts.length >= 3 ? parts[1] : null
}

function tokenFor(userId: string): string {
  return `token.${userId}.${Date.now()}`
}

function sessionFor(user: AuthUser): AuthSession {
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString()
  return { user, accessToken: tokenFor(user.id), expiresAt }
}

function delayFor(path: string): Promise<void> {
  const ms = 140 + (path.length % 5) * 60
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------------------------
// query helpers
// ---------------------------------------------------------------------------------------------
function paginate<T>(items: T[], params: Record<string, unknown>): { items: T[]; meta: PaginationMeta } {
  const page = Math.max(1, Number(params.page ?? 1))
  const limit = Math.max(1, Number(params.limit ?? 10))
  const start = (page - 1) * limit
  return { items: items.slice(start, start + limit), meta: { page, limit, total: items.length } }
}

function searchTerm(params: Record<string, unknown>): string {
  return String(params.search ?? '')
    .trim()
    .toLowerCase()
}

function matches(needle: string, values: Array<string | null | undefined>): boolean {
  if (!needle) return true
  return values.some((value) => value?.toLowerCase().includes(needle))
}

/**
 * Roster read model: the entity plus its class, primary guardian and the roll-ups the table shows.
 * Attendance share and fee standing are computed here, the way the backend's list query would — not
 * in the component — so the row arrives ready to render. Roll number is stored on the student.
 */
function studentListItems(): StudentListItem[] {
  return students.map((student) => {
    const classRoom = classes.find((item) => item.id === student.classId)
    const user = users.find((item) => item.id === student.userId)
    const primaryLink = parentStudents.find((link) => link.studentId === student.id && link.isPrimary)
    const guardian = primaryLink ? parents.find((parent) => parent.id === primaryLink.parentId) : undefined

    const register = attendance.filter((record) => record.studentId === student.id)
    const present = register.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length
    const invoices = feeInvoices.filter((invoice) => invoice.studentId === student.id)
    const duePaise = invoices.reduce((total, invoice) => total + outstanding(invoice), 0)
    const today = dateOffset(0)
    // A balance past its due date is overdue even when the stored status has not caught up.
    const isOverdue = invoices.some(
      (invoice) => invoice.status === 'OVERDUE' || (invoice.dueDate < today && outstanding(invoice) > 0),
    )

    return {
      ...student,
      className: classRoom ? classLabel(classRoom) : 'Unassigned',
      guardian: guardian
        ? {
            name: `${guardian.firstName} ${guardian.lastName}`.trim(),
            relation: primaryLink?.relation ?? null,
            email: guardian.email,
            phone: guardian.phone,
            address: guardian.address,
          }
        : null,
      email: user?.email ?? '',
      attendancePercentage: register.length === 0 ? 0 : Math.round((present / register.length) * 100),
      feeStanding: isOverdue ? 'OVERDUE' : duePaise > 0 ? 'UNPAID' : 'PAID',
    }
  })
}

/**
 * Teacher grid read model: the profile plus its login email and the classes they are assigned to,
 * derived from the join rather than duplicated on the profile.
 */
function teacherListItems(): TeacherListItem[] {
  return teachers.map((teacher) => {
    const user = users.find((item) => item.id === teacher.userId)
    const classIds = [
      ...new Set(teacherClasses.filter((link) => link.teacherId === teacher.id).map((link) => link.classId)),
    ]

    return {
      ...teacher,
      email: user?.email ?? '',
      classIds,
      classLabels: classIds.flatMap((classId) => {
        const classRoom = classes.find((item) => item.id === classId)
        return classRoom ? [classLabel(classRoom)] : []
      }),
    }
  })
}

/**
 * Homework grid read model: the assignment plus its joined class, subject and author, the
 * submission roll-up and the status derived from the due date — computed here, the way the
 * backend's list query would, so the card renders what it is handed rather than aggregating.
 */
function homeworkListItems(): HomeworkListItem[] {
  const today = dateOffset(0)

  return (
    homework
      // A soft-deleted assignment keeps its row (and its submissions) but leaves the grid.
      .filter((assignment) => assignment.deletedAt === null)
      .map((assignment) => {
        const classRoom = classes.find((item) => item.id === assignment.classId)
        const subject = findSubject(assignment.subjectId)
        const teacher = findTeacher(assignment.teacherId)
        const roster = students.filter(
          (student) => student.classId === assignment.classId && student.status === 'ACTIVE',
        )

        return {
          id: assignment.id,
          classId: assignment.classId,
          className: classRoom ? classLabel(classRoom) : 'Unassigned',
          subjectId: assignment.subjectId,
          subjectName: subject?.name ?? '—',
          teacherId: assignment.teacherId,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : '—',
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          maxMarks: assignment.maxMarks,
          attachments: assignment.attachments,
          submittedCount: homeworkSubmissions.filter((submission) => submission.homeworkId === assignment.id).length,
          totalStudents: roster.length,
          status: assignment.dueDate < today ? 'OVERDUE' : 'ACTIVE',
        }
      })
  )
}

/** `GET /homework` is role-scoped: staff see the school, a student their class, a parent their children's. */
function homeworkVisibleTo(assignment: HomeworkListItem, user: AuthUser | undefined): boolean {
  if (!user || user.role === 'ADMIN' || user.role === 'TEACHER') return true
  if (user.role === 'STUDENT') return assignment.classId === user.classId

  const childClassIds = parentStudents
    .filter((link) => link.parentId === user.profileId)
    .map((link) => findStudent(link.studentId)?.classId)
    .filter((classId): classId is string => Boolean(classId))

  return childClassIds.includes(assignment.classId)
}

// ---------------------------------------------------------------------------------------------
// timetable read model — the class's week: its period rows, each day's slots and the stat roll-ups
// ---------------------------------------------------------------------------------------------

/** A day that was never built gets its row on demand, so a class can adopt another school day later. */
function dayTimetableOf(classId: string, day: Weekday): Timetable {
  const existing = timetables.find((item) => item.classId === classId && item.day === day)
  if (existing) return existing

  const created: Timetable = {
    id: `tt_${classId.replace('cls_', '')}_${day}`,
    schoolId: SCHOOL_ID,
    classId,
    academicYear: ACADEMIC_YEAR,
    day,
  }

  timetables.push(created)
  return created
}

function periodRowsOf(timetable: Timetable): Period[] {
  return periods
    .filter((period) => period.timetableId === timetable.id)
    .sort((left, right) => left.orderIndex - right.orderIndex)
}

/**
 * The rows as the grid reads them. A named row keeps its label; a numbered one derives `Period n`
 * from its place, counting teaching rows only — which is why the period after the short break is
 * `Period 4` and not `Period 5`.
 */
function labelRows(rows: Period[]): TimetablePeriodRow[] {
  let teaching = 0

  return rows.map((row) => {
    if (!row.isBreak) teaching += 1

    return {
      orderIndex: row.orderIndex,
      label: row.label ?? (row.isBreak ? 'Break' : `Period ${teaching}`),
      startTime: row.startTime,
      endTime: row.endTime,
      isBreak: row.isBreak,
    }
  })
}

function teacherNameOf(teacherId: string | null): string | null {
  const teacher = findTeacher(teacherId)
  return teacher ? `${teacher.firstName} ${teacher.lastName}` : null
}

function classTimetable(classId: string): ClassTimetable | undefined {
  const classRoom = classes.find((item) => item.id === classId)
  if (!classRoom) return undefined

  // The rows are the class's, so the first day speaks for all of them.
  const rows = labelRows(periodRowsOf(dayTimetableOf(classId, 'MON')))

  const days: TimetableDay[] = weekdays.map((day) => {
    const scheduled = periodRowsOf(dayTimetableOf(classId, day))

    return {
      day,
      slots: rows.map((_, index) => {
        const period = scheduled[index]

        return {
          subjectId: period?.subjectId ?? null,
          subjectName: period?.subjectId ? (findSubject(period.subjectId)?.name ?? null) : null,
          teacherId: period?.teacherId ?? null,
          teacherName: teacherNameOf(period?.teacherId ?? null),
          room: period?.room ?? null,
        }
      }),
    }
  })

  const taught = days.flatMap((day) => day.slots).filter((slot) => slot.subjectName !== null)

  return {
    classId,
    className: classLabel(classRoom),
    academicYear: ACADEMIC_YEAR,
    periods: rows,
    days,
    stats: {
      periodRows: rows.length,
      weeklySlots: days.length * rows.filter((row) => !row.isBreak).length,
      subjects: new Set(taught.map((slot) => slot.subjectName)).size,
      // A slot can be scheduled without a teacher yet; that is not a teacher to count.
      teachers: new Set(taught.map((slot) => slot.teacherName).filter((name) => name !== null)).size,
    },
  }
}

function fullNameParts(fullName: string): { firstName: string; lastName: string } {
  const [firstName, ...rest] = fullName.trim().split(' ')

  return { firstName, lastName: rest.join(' ') }
}

// ---------------------------------------------------------------------------------------------
// profile payloads — each one is what one tab renders, computed here rather than in the view
// ---------------------------------------------------------------------------------------------

function studentProfile(id: string): StudentProfile | undefined {
  const row = studentListItems().find((item) => item.id === id)
  if (!row) return undefined

  const classRoom = classes.find((item) => item.id === row.classId)
  const teacher = findTeacher(classRoom?.classTeacherId ?? null)
  const days = [...new Set(attendance.filter((record) => record.studentId === id).map((r) => r.attendanceDate))].sort()

  function isIn(day: string): boolean {
    const record = attendance.find((item) => item.studentId === id && item.attendanceDate === day)
    return record?.status === 'PRESENT' || record?.status === 'LATE'
  }

  // Streak: present days counted back from the most recent register day.
  let streakDays = 0
  for (const day of [...days].reverse()) {
    if (!isIn(day)) break
    streakDays += 1
  }

  const daysPresent = days.filter(isIn).length

  return {
    ...row,
    classTeacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
    streakDays,
    daysPresent,
    daysAbsent: days.length - daysPresent,
  }
}

function studentAttendance(id: string): StudentAttendance | undefined {
  const records = attendance.filter((record) => record.studentId === id)
  if (records.length === 0) return undefined

  const byMonth = new Map<string, { month: string; present: number; absent: number; late: number; total: number }>()
  for (const record of records) {
    const date = new Date(record.attendanceDate)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const month = byMonth.get(key) ?? {
      month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    }

    if (record.status === 'PRESENT') month.present += 1
    else if (record.status === 'LATE') month.late += 1
    else month.absent += 1
    month.total += 1
    byMonth.set(key, month)
  }

  const months = [...byMonth.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([, month]) => ({ ...month, rate: rateOf(month.present + month.late, month.total) }))

  const present = records.filter((record) => record.status === 'PRESENT').length
  const late = records.filter((record) => record.status === 'LATE').length

  return {
    totals: {
      total: records.length,
      present,
      // Present and late are both "in", so both count towards the rate (as the roster does).
      absent: records.length - present - late,
      late,
      rate: rateOf(present + late, records.length),
    },
    months,
  }
}

function rateOf(attended: number, total: number): number {
  return total === 0 ? 0 : Math.round((attended / total) * 100)
}

function studentMarks(id: string): StudentMarkRow[] {
  return examResults
    .filter((result) => result.studentId === id)
    .flatMap((result) => {
      const exam = exams.find((item) => item.id === result.examId)
      const subject = findSubject(result.subjectId)
      if (!exam || !subject) return []

      const paper = examSubjects.find((item) => item.examId === exam.id && item.subjectId === subject.id)
      const total = paper?.maxMarks ?? maxMarks
      const percentage = Number(((result.obtainedMarks / total) * 100).toFixed(1))

      return [
        {
          id: result.id,
          examName: exam.name,
          examType: exam.type,
          subjectName: subject.name,
          date: paper?.examDate ?? exam.startDate,
          marks: result.obtainedMarks,
          total,
          percentage,
          grade: gradeForPercentage(percentage),
          result: percentage >= 40 ? ('PASS' as const) : ('FAIL' as const),
          isPublished: exam.isPublished,
        },
      ]
    })
    .sort((left, right) => right.date.localeCompare(left.date))
}

function studentResults(id: string): StudentResults {
  const rows = studentMarks(id)
  const average =
    rows.length === 0 ? 0 : Number((rows.reduce((total, row) => total + row.percentage, 0) / rows.length).toFixed(1))

  return {
    summary: {
      passed: rows.filter((row) => row.result === 'PASS').length,
      failed: rows.filter((row) => row.result === 'FAIL').length,
      average,
    },
    rows,
  }
}

function studentFees(id: string): StudentFees {
  const rows = feeInvoices
    .filter((invoice) => invoice.studentId === id)
    .map((invoice) => {
      const payment = feePayments.find((item) => item.invoiceId === invoice.id)

      return {
        id: invoice.id,
        title: findFeeHead(invoice.feeHeadId)?.name ?? 'Fee invoice',
        amountPaise: invoice.amountPaise,
        paidPaise: invoice.paidPaise,
        paidAt: payment?.paidAt ?? null,
        method: payment?.method ?? null,
        status: invoice.status,
      }
    })
    .sort((left, right) => left.id.localeCompare(right.id))

  const paidPaise = rows.reduce((total, row) => total + row.paidPaise, 0)
  const duePaise = rows.reduce((total, row) => total + Math.max(row.amountPaise - row.paidPaise, 0), 0)

  return { summary: { paidPaise, duePaise, totalPaise: paidPaise + duePaise }, rows }
}

/** A roll number is unique within its class — the roster cannot show 5-A twice. */
function rollTaken(classId: string, rollNo: number, exceptStudentId?: string): boolean {
  return students.some(
    (item) =>
      item.classId === classId && item.rollNo === rollNo && item.id !== exceptStudentId && item.status === 'ACTIVE',
  )
}

/**
 * Links the student's primary guardian, creating the parent record when the name is new. Passing
 * `undefined` leaves the current link alone; passing a blank name unlinks it.
 */
function upsertGuardian(student: Student, guardian: Guardian | null | undefined): void {
  // `undefined` means the caller sent no guardian at all — leave the existing link alone.
  if (guardian === undefined) return

  const existingLink = parentStudents.find((link) => link.studentId === student.id && link.isPrimary)
  const details = guardian?.name.trim() ? guardian : null

  if (!details) {
    if (existingLink) existingLink.isPrimary = false
    return
  }

  const name = details.name.trim()
  const [firstName, ...rest] = name.split(' ')
  const lastName = rest.join(' ')

  let parent = existingLink ? parents.find((item) => item.id === existingLink.parentId) : undefined
  if (!parent && details.email) parent = parents.find((item) => item.email === details.email)

  if (!parent) {
    const index = parents.length + 1
    parent = {
      id: `par_${index}`,
      schoolId: SCHOOL_ID,
      userId: `usr_par_${index}`,
      firstName,
      lastName,
      email: details.email,
      address: details.address,
      phone: details.phone,
      occupation: null,
      status: 'ACTIVE',
    }

    parents.push(parent)
    users.push({
      id: parent.userId,
      email: details.email ?? schoolEmail(index, `parent.${SCHOOL_DOMAIN}`),
      role: 'PARENT',
      schoolId: SCHOOL_ID,
      // The guardian's login goes out under the same invite rule as the student's.
      isVerified: false,
      profileId: parent.id,
      firstName,
      lastName,
      classId: null,
    })
    invitedPasswords.set(parent.userId, invitePassword())
  } else {
    parent.firstName = firstName
    parent.lastName = lastName
    parent.email = details.email ?? parent.email
    parent.phone = details.phone ?? parent.phone
    parent.address = details.address ?? parent.address
  }

  if (existingLink) {
    existingLink.parentId = parent.id
  } else {
    parentStudents.push({
      id: `psl_${parent.id}_${student.id}`,
      schoolId: SCHOOL_ID,
      parentId: parent.id,
      studentId: student.id,
      relation: 'GUARDIAN',
      isPrimary: true,
    })
  }
}

// ---------------------------------------------------------------------------------------------
// fees — read models. Every roll-up, join and aggregate is computed here, not in the view.
// ---------------------------------------------------------------------------------------------

/** Continues the demo's receipt run for payments recorded through the collect form. */
let manualReceiptSeq = 90000

function outstanding(invoice: FeeInvoice): number {
  return Math.max(invoice.amountPaise - invoice.discountPaise - invoice.paidPaise, 0)
}

function studentNameOf(studentId: string): string {
  const student = students.find((item) => item.id === studentId)
  return student ? `${student.firstName} ${student.lastName}` : 'Unknown student'
}

function classNameOf(studentId: string): string {
  const student = students.find((item) => item.id === studentId)
  const classRoom = classes.find((item) => item.id === student?.classId)
  return classRoom ? classLabel(classRoom) : 'Unassigned'
}

function titleForInvoice(invoice: FeeInvoice): string {
  return findFeeHead(invoice.feeHeadId)?.name ?? 'Fee invoice'
}

function invoiceListItems(): FeeInvoiceListItem[] {
  return feeInvoices.map((invoice) => {
    const student = students.find((item) => item.id === invoice.studentId)
    const classRoom = classes.find((item) => item.id === student?.classId)

    return {
      ...invoice,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown student',
      admissionNo: student?.admissionNo ?? '—',
      className: classRoom ? classLabel(classRoom) : 'Unassigned',
      title: titleForInvoice(invoice),
    }
  })
}

/** Students with nothing left to pay count as collected; the rest are the defaulter line. */
function feeCollectionSummary(): FeeCollectionSummary {
  const invoices = invoiceListItems()
  const monthPrefix = dateOffset(0).slice(0, 7)
  const paidAtByInvoice = new Map(feePayments.map((payment) => [payment.invoiceId, payment.paidAt ?? '']))
  const balanceByStudent = new Map<string, number>()

  let collectedPaise = 0
  let thisMonthPaise = 0
  let pendingPaise = 0
  let concessionPaise = 0
  let overdueCount = 0

  for (const invoice of invoices) {
    collectedPaise += invoice.paidPaise
    concessionPaise += invoice.discountPaise
    pendingPaise += outstanding(invoice)
    if ((paidAtByInvoice.get(invoice.id) ?? '').slice(0, 7) === monthPrefix) thisMonthPaise += invoice.paidPaise
    if (invoice.status === 'OVERDUE') overdueCount += 1
    balanceByStudent.set(invoice.studentId, (balanceByStudent.get(invoice.studentId) ?? 0) + outstanding(invoice))
  }

  const active = students.filter((student) => student.status === 'ACTIVE')
  const pendingStudents = active.filter((student) => (balanceByStudent.get(student.id) ?? 0) > 0).length

  return {
    collectedPaise,
    thisMonthPaise,
    pendingPaise,
    concessionPaise,
    overdueCount,
    totalStudents: active.length,
    paidStudents: active.length - pendingStudents,
    pendingStudents,
  }
}

function pendingInvoiceRows(): Array<{
  invoiceId: string
  studentId: string
  studentName: string
  className: string
  title: string
  dueDate: string
  amountPaise: number
  balancePaise: number
  status: InvoiceStatus
}> {
  const open: InvoiceStatus[] = ['PENDING', 'PARTIAL', 'OVERDUE']

  return invoiceListItems()
    .filter((invoice) => open.includes(invoice.status))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .map((invoice) => ({
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      className: invoice.className,
      title: invoice.title,
      dueDate: invoice.dueDate,
      amountPaise: invoice.amountPaise,
      balancePaise: outstanding(invoice),
      status: invoice.status,
    }))
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * The fees dashboard's charts. The trend is the real register — a month with no collection shows a
 * zero rather than an invented bar — and coverage runs the last twelve months.
 */
function feeDashboard(): FeeDashboard {
  const invoices = invoiceListItems()
  const paidAtByInvoice = new Map(feePayments.map((payment) => [payment.invoiceId, payment.paidAt ?? '']))
  const now = new Date()

  const collectionTrend: FeeTrendPoint[] = Array.from({ length: 12 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + offset, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    let collectedPaise = 0
    let pendingPaise = 0
    for (const invoice of invoices) {
      if ((paidAtByInvoice.get(invoice.id) ?? '').slice(0, 7) === key) collectedPaise += invoice.paidPaise
      if (invoice.dueDate.slice(0, 7) === key) pendingPaise += outstanding(invoice)
    }

    return { label: MONTH_LABELS[date.getMonth()], collectedPaise, pendingPaise }
  })

  const classCollection: FeeChartPoint[] = classes.map((classRoom) => {
    const studentIds = new Set(students.filter((student) => student.classId === classRoom.id).map((item) => item.id))
    const value = invoices
      .filter((invoice) => studentIds.has(invoice.studentId))
      .reduce((total, invoice) => total + invoice.paidPaise, 0)

    return { label: classLabel(classRoom), value }
  })

  return { collectionTrend, classCollection, pending: pendingInvoiceRows() }
}

function feeStructureDetails(classId: string): FeeStructureDetail[] {
  const selected = classId ? feeStructures.filter((structure) => structure.classId === classId) : feeStructures

  return selected.map((structure) => {
    const classRoom = classes.find((item) => item.id === structure.classId)
    const heads = headsForStructure(structure.id).map<FeeHeadRow>((head) => ({
      ...head,
      className: classRoom ? classLabel(classRoom) : 'Unassigned',
      structureName: structure.name,
      academicYear: structure.academicYear,
    }))

    return {
      ...structure,
      className: classRoom ? classLabel(classRoom) : 'Unassigned',
      heads,
      totalHeads: heads.length,
      totalAmountPaise: heads.reduce((total, head) => total + head.amountPaise, 0),
    }
  })
}

/** One row per student: what was billed, what came in, what is left. */
function classFeeStatusRows(classId = '', status = ''): ClassFeeStatusRow[] {
  return students
    .filter((student) => student.status === 'ACTIVE')
    .filter((student) => (classId ? student.classId === classId : true))
    .map((student) => {
      const invoices = invoiceListItems().filter((invoice) => invoice.studentId === student.id)
      const totalDuePaise = invoices.reduce((total, invoice) => total + invoice.amountPaise - invoice.discountPaise, 0)
      const paidPaise = invoices.reduce((total, invoice) => total + invoice.paidPaise, 0)
      const pendingPaise = invoices.reduce((total, invoice) => total + outstanding(invoice), 0)
      const resolved: InvoiceStatus =
        pendingPaise === 0
          ? 'PAID'
          : invoices.some((invoice) => invoice.status === 'OVERDUE')
            ? 'OVERDUE'
            : invoices.some((invoice) => invoice.status === 'PARTIAL')
              ? 'PARTIAL'
              : 'PENDING'

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        className: classNameOf(student.id),
        admissionNo: student.admissionNo,
        totalDuePaise,
        paidPaise,
        pendingPaise,
        status: resolved,
      }
    })
    .filter((row) => (status ? row.status === status : true))
    .sort(
      (left, right) =>
        left.className.localeCompare(right.className) || left.studentName.localeCompare(right.studentName),
    )
}

function feeCollectSummary(classId: string, status: string): FeeCollectSummary {
  const rows = classFeeStatusRows(classId, status)

  return {
    totalStudents: rows.length,
    paidStudents: rows.filter((row) => row.pendingPaise === 0).length,
    pendingStudents: rows.filter((row) => row.pendingPaise > 0).length,
    totalCollectedPaise: rows.reduce((total, row) => total + row.paidPaise, 0),
    totalPendingPaise: rows.reduce((total, row) => total + row.pendingPaise, 0),
  }
}

function concessionAmountFor(studentId: string, head: FeeHead): number {
  const concession = concessions.find(
    (item) => item.studentId === studentId && item.feeHeadId === head.id && item.status === 'APPROVED',
  )
  if (!concession) return 0

  if (concession.type === 'PERCENTAGE') {
    return Math.round((head.amountPaise * (concession.percentage ?? 0)) / 100)
  }

  return Math.min(head.amountPaise, concession.amountPaise ?? 0)
}

function studentCollectSummary(studentId: string): StudentCollectSummary | undefined {
  const student = students.find((item) => item.id === studentId)
  if (!student) return undefined

  const structure = structureForClass(student.classId)
  const invoices = invoiceListItems().filter((invoice) => invoice.studentId === studentId)
  const invoicedHeads = new Set(invoices.map((invoice) => invoice.feeHeadId))

  const dues: StudentDueRow[] = invoices
    .filter((invoice) => outstanding(invoice) > 0)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .map((invoice) => ({
      invoiceId: invoice.id,
      title: invoice.title,
      totalPaise: invoice.amountPaise,
      paidPaise: invoice.paidPaise,
      balancePaise: outstanding(invoice),
      dueDate: invoice.dueDate,
      status: invoice.status,
    }))

  const invoiceCandidates: InvoiceCandidateRow[] = headsForStructure(structure.id).map((head) => {
    const concessionPaise = concessionAmountFor(studentId, head)

    return {
      feeHeadId: head.id,
      title: head.name,
      grossPaise: head.amountPaise,
      concessionPaise,
      netPaise: head.amountPaise - concessionPaise,
      frequency: head.frequency,
      hasInvoice: invoicedHeads.has(head.id),
    }
  })

  const payments: PaymentHistoryRow[] = invoices
    .filter((invoice) => invoice.receiptNo !== null)
    .map((invoice) => {
      const payment = feePayments.find((item) => item.invoiceId === invoice.id)

      return {
        id: payment?.id ?? invoice.id,
        receiptNo: invoice.receiptNo ?? '—',
        title: invoice.title,
        amountPaise: invoice.paidPaise,
        method: payment?.method ?? 'CASH',
        paidAt: payment?.paidAt ?? invoice.dueDate,
      }
    })
    .sort((left, right) => right.paidAt.localeCompare(left.paidAt))

  return {
    studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    className: classNameOf(studentId),
    admissionNo: student.admissionNo,
    rollNo: student.rollNo,
    totalPaidPaise: invoices.reduce((total, invoice) => total + invoice.paidPaise, 0),
    balancePaise: invoices.reduce((total, invoice) => total + outstanding(invoice), 0),
    dues,
    invoiceCandidates,
    payments,
  }
}

function receiptFor(paymentId: string): Receipt | undefined {
  const payment = feePayments.find((item) => item.id === paymentId)
  if (!payment) return undefined

  const invoice = findFeeInvoice(payment.invoiceId)
  if (!invoice) return undefined

  const student = students.find((item) => item.id === payment.studentId)
  const head = findFeeHead(invoice.feeHeadId)

  return {
    receiptNo: invoice.receiptNo ?? `RCP-${invoice.id}`,
    studentName: studentNameOf(payment.studentId),
    className: classNameOf(payment.studentId),
    admissionNo: student?.admissionNo ?? '—',
    rollNo: student?.rollNo ?? 0,
    paidAt: payment.paidAt ?? new Date().toISOString(),
    items: [{ title: head?.name ?? 'Fee payment', amountPaise: payment.amountPaise }],
    amountPaidPaise: payment.amountPaise,
    method: payment.method,
    reference: payment.remarks,
  }
}

function latestPaymentDate(): string {
  const dates = feePayments.map((payment) => (payment.paidAt ?? '').slice(0, 10)).filter(Boolean)
  return dates.sort()[dates.length - 1] ?? dateOffset(0)
}

function dayBookReport(date: string): DayBook {
  const day = date || latestPaymentDate()
  const rows: DayBookRow[] = feePayments
    .filter((payment) => (payment.paidAt ?? '').slice(0, 10) === day)
    .map((payment) => {
      const invoice = findFeeInvoice(payment.invoiceId)

      return {
        id: payment.id,
        receiptNo: invoice?.receiptNo ?? '—',
        studentName: studentNameOf(payment.studentId),
        className: classNameOf(payment.studentId),
        title: invoice ? titleForInvoice(invoice) : 'Fee payment',
        amountPaise: payment.amountPaise,
        method: payment.method,
        status: payment.status,
      }
    })

  return { rows, count: rows.length, totalPaise: rows.reduce((total, row) => total + row.amountPaise, 0) }
}

function classReportRows(classId: string): ClassReportRow[] {
  return students
    .filter((student) => student.status === 'ACTIVE' && student.classId === classId)
    .map((student) => {
      const invoices = invoiceListItems().filter((invoice) => invoice.studentId === student.id)
      const totalInvoicedPaise = invoices.reduce(
        (total, invoice) => total + invoice.amountPaise - invoice.discountPaise,
        0,
      )
      const totalPaidPaise = invoices.reduce((total, invoice) => total + invoice.paidPaise, 0)
      const balancePaise = invoices.reduce((total, invoice) => total + outstanding(invoice), 0)

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        totalInvoicedPaise,
        totalPaidPaise,
        balancePaise,
        status:
          balancePaise === 0
            ? ('CLEAR' as const)
            : invoices.some((invoice) => invoice.status === 'OVERDUE')
              ? ('OVERDUE' as const)
              : ('PENDING' as const),
      }
    })
    .sort((left, right) => left.rollNo - right.rollNo)
}

function defaulterRows(classId: string): DefaulterRow[] {
  return invoiceListItems()
    .filter((invoice) => outstanding(invoice) > 0)
    .filter((invoice) => (classId ? findStudent(invoice.studentId)?.classId === classId : true))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .map((invoice) => ({
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      className: invoice.className,
      rollNo: findStudent(invoice.studentId)?.rollNo ?? 0,
      title: invoice.title,
      duePaise: outstanding(invoice),
      dueDate: invoice.dueDate,
      status: invoice.status,
    }))
}

function studentLedger(studentId: string): StudentLedger {
  const invoices = invoiceListItems()
    .filter((invoice) => invoice.studentId === studentId)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))

  const rows: StudentLedgerRow[] = invoices.map((invoice) => {
    const payment = feePayments.find((item) => item.invoiceId === invoice.id)

    return {
      id: invoice.id,
      receiptNo: invoice.receiptNo,
      title: invoice.title,
      amountPaise: invoice.amountPaise,
      paidPaise: invoice.paidPaise,
      method: payment?.method ?? null,
      dueDate: invoice.dueDate,
      paidAt: payment?.paidAt ?? null,
      status: invoice.status,
    }
  })

  return {
    rows,
    totalInvoicedPaise: rows.reduce((total, row) => total + row.amountPaise, 0),
    totalPaidPaise: rows.reduce((total, row) => total + row.paidPaise, 0),
    balancePaise: invoices.reduce((total, invoice) => total + outstanding(invoice), 0),
  }
}

function concessionRows(): ConcessionRow[] {
  return concessions.map((concession) => {
    const student = students.find((item) => item.id === concession.studentId)
    const structure = structureForClass(student?.classId ?? null)
    const head = findFeeHead(concession.feeHeadId) ?? headsForStructure(structure.id)[1]
    const grossPaise = head?.amountPaise ?? 0
    const discountPaise =
      concession.type === 'PERCENTAGE'
        ? Math.round((grossPaise * (concession.percentage ?? 0)) / 100)
        : Math.min(grossPaise, concession.amountPaise ?? 0)

    return {
      ...concession,
      studentName: studentNameOf(concession.studentId),
      className: classNameOf(concession.studentId),
      feeHeadTitle: findFeeHead(concession.feeHeadId)?.name ?? null,
      discountLabel:
        concession.type === 'PERCENTAGE' ? `${concession.percentage ?? 0}%` : formatPaise(concession.amountPaise ?? 0),
      effectivePaise: Math.max(grossPaise - discountPaise, 0),
    }
  })
}

// ---------------------------------------------------------------------------------------------
// demo-only account store, so the signup flow can be completed without a backend
// ---------------------------------------------------------------------------------------------
interface PendingRegistration {
  email: string
  password: string
  firstName: string
  lastName: string
}

const pendingRegistrations = new Map<string, PendingRegistration>()

function syntheticAdmin(registration: PendingRegistration): AuthUser {
  return {
    id: `usr_admin_${registration.email}`,
    email: registration.email,
    role: 'ADMIN',
    schoolId: activeSchool.id,
    isVerified: true,
    profileId: null,
    firstName: registration.firstName,
    lastName: registration.lastName,
    classId: null,
  }
}

/** Passwords minted for invited logins, so a newly enrolled student or teacher can actually sign in. */
const invitedPasswords = new Map<string, string>()

/**
 * A real API generates a random password per invite. The mock hands out the shared demo password
 * instead, so an invited account is usable as soon as its verification lands.
 */
function invitePassword(): string {
  return DEMO_PASSWORD
}

function resolveLogin(email: string, password: string): AuthUser | null {
  const account = demoAccounts.find((item) => item.email.toLowerCase() === email.toLowerCase())
  if (account && account.password === password) {
    return users.find((user) => user.id === account.userId) ?? null
  }

  const registration = pendingRegistrations.get(email.toLowerCase())
  if (registration && registration.password === password) return syntheticAdmin(registration)

  const invited = users.find((user) => user.email.toLowerCase() === email.toLowerCase())
  if (invited && invitedPasswords.get(invited.id) === password) return invited

  return null
}

/** The line under a participant's name: their class, their subject, or else their role. */
function participantLabel(user: AuthUser): string {
  if (user.role === 'STUDENT') {
    const classRoom = classes.find((item) => item.id === user.classId)
    return classRoom ? `Class ${classLabel(classRoom)}` : 'Student'
  }

  if (user.role === 'TEACHER') return findTeacher(user.profileId)?.subject ?? 'Teacher'

  return humanizeEnum(user.role)
}

/**
 * Conversation list read model: the caller's threads with the other participant resolved and the
 * newest message previewed, newest activity first — the way the backend's list query reads.
 */
function conversationListItems(userId: string | null): ConversationListItem[] {
  const me = users.find((item) => item.id === userId)
  if (!me) return []

  return conversations
    .filter((conversation) => conversation.participantIds.includes(me.id))
    .flatMap((conversation) => {
      const other = users.find((item) => item.id !== me.id && conversation.participantIds.includes(item.id))
      if (!other) return []

      const thread = [...messages]
        .filter((message) => message.conversationId === conversation.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))

      return [
        {
          id: conversation.id,
          name: `${other.firstName} ${other.lastName}`,
          participantLabel: participantLabel(other),
          lastMessage: thread[thread.length - 1]?.body ?? '',
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: thread.filter((message) => message.senderId !== me.id && message.readAt === null).length,
        },
      ]
    })
    .sort((left, right) => (right.lastMessageAt ?? '').localeCompare(left.lastMessageAt ?? ''))
}

/** One thread's history, oldest message first, with each side resolved against the caller. */
function conversationMessages(conversationId: string, userId: string): ChatMessageListItem[] {
  return messages
    .filter((message) => message.conversationId === conversationId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((message) => ({
      id: message.id,
      body: message.body,
      mine: message.senderId === userId,
      sentAt: message.createdAt,
      read: message.readAt !== null,
    }))
}

/** The catalogue grouped for the editor, groups in catalogue order. */
function permissionGroups(): PermissionGroupRow[] {
  return [...new Set(permissions.map((permission) => permission.group))].map((group) => ({
    group,
    permissions: permissions
      .filter((permission) => permission.group === group)
      .sort((left, right) => left.sortOrder - right.sortOrder),
  }))
}

function grantedKeysFor(userId: string): string[] {
  const keyById = new Map(permissions.map((permission) => [permission.id, permission.key]))

  return userPermissions
    .filter((grant) => grant.userId === userId)
    .flatMap((grant) => {
      const key = keyById.get(grant.permissionId)
      return key ? [key] : []
    })
}

/** One account's grants plus the identity the editor header shows. */
function userPermissionSummary(userId: string): UserPermissions | undefined {
  const user = users.find((item) => item.id === userId)
  if (!user) return undefined

  return {
    userId,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    employeeNo: findTeacher(user.profileId)?.employeeNo ?? '—',
    grantedKeys: grantedKeysFor(userId),
    totalCount: permissions.length,
  }
}

/** The staff picker: active teachers with how many permissions each holds, newest employee first. */
function staffPermissionRows(): StaffPermissionRow[] {
  return users
    .filter((user) => user.role === 'TEACHER')
    .flatMap((user) => {
      const teacher = findTeacher(user.profileId)
      if (!teacher || teacher.status !== 'ACTIVE') return []

      return [
        {
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          employeeNo: teacher.employeeNo,
          grantedCount: grantedKeysFor(user.id).length,
          totalCount: permissions.length,
        },
      ]
    })
    .sort((left, right) => right.employeeNo.localeCompare(left.employeeNo))
}

/** Derived from the dates, never stored — `COMPLETED` once the window has closed. */
function examStatusOf(exam: Exam): ExamStatus {
  return exam.endDate < dateOffset(0) ? 'COMPLETED' : 'UPCOMING'
}

/** The papers of one exam, resolved for the subject schedule and the edit form. */
function examSubjectRowsOf(examId: string): ExamSubjectRow[] {
  return examSubjects
    .filter((paper) => paper.examId === examId)
    .sort((left, right) => left.examDate.localeCompare(right.examDate))
    .flatMap((paper) => {
      const subject = findSubject(paper.subjectId)
      if (!subject) return []

      return [
        {
          id: paper.id,
          subjectId: paper.subjectId,
          subjectName: subject.name,
          subjectCode: subject.code.split('-')[0],
          examDate: paper.examDate,
          maxMarks: paper.maxMarks,
          durationMin: paper.durationMin,
        },
      ]
    })
}

/** The Tests tab's rows — a single-subject assessment, newest date first. */
function testListItems(): TestListItem[] {
  return exams
    .filter((exam) => exam.kind === 'TEST')
    .flatMap((exam) => {
      const paper = examSubjects.find((item) => item.examId === exam.id)
      const classRoom = classes.find((item) => item.id === exam.classId)
      const subject = paper ? findSubject(paper.subjectId) : undefined
      if (!paper || !subject) return []

      return [
        {
          id: exam.id,
          name: exam.name,
          classId: exam.classId,
          className: classRoom ? classLabel(classRoom) : 'Unassigned',
          subjectId: paper.subjectId,
          subjectName: subject.name,
          subjectCode: subject.code.split('-')[0],
          examDate: paper.examDate,
          maxMarks: paper.maxMarks,
          durationMin: paper.durationMin,
          status: examStatusOf(exam),
          isPublished: exam.isPublished,
        },
      ]
    })
    .sort((left, right) => right.examDate.localeCompare(left.examDate))
}

/** The Exams tab's rows — a multi-subject window, carried with its subject schedule. */
function examListItems(): ExamListItem[] {
  return exams
    .filter((exam) => exam.kind === 'EXAM')
    .map((exam) => {
      const classRoom = classes.find((item) => item.id === exam.classId)

      return {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        classId: exam.classId,
        className: classRoom ? classLabel(classRoom) : 'Unassigned',
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: examStatusOf(exam),
        isPublished: exam.isPublished,
        subjects: examSubjectRowsOf(exam.id),
      }
    })
    .sort((left, right) => right.startDate.localeCompare(left.startDate))
}

/** The marks sheet: every subject with its entry count, the class roster, and the marks so far. */
function resultSheet(examId: string): ResultSheet | undefined {
  const exam = exams.find((item) => item.id === examId)
  if (!exam) return undefined

  const classRoom = classes.find((item) => item.id === exam.classId)
  const papers = examSubjectRowsOf(exam.id)

  return {
    examId: exam.id,
    examName: exam.name,
    type: exam.type,
    kind: exam.kind,
    classId: exam.classId,
    className: classRoom ? classLabel(classRoom) : 'Unassigned',
    isPublished: exam.isPublished,
    subjects: papers.map((paper) => ({
      subjectId: paper.subjectId,
      subjectName: paper.subjectName,
      subjectCode: paper.subjectCode,
      examDate: paper.examDate,
      maxMarks: paper.maxMarks,
      enteredCount: examResults.filter((result) => result.examId === exam.id && result.subjectId === paper.subjectId)
        .length,
    })),
    students: students
      .filter((student) => student.classId === exam.classId && student.status === 'ACTIVE')
      .sort((left, right) => left.rollNo - right.rollNo)
      .map((student) => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
      })),
    entries: examResults
      .filter((result) => result.examId === exam.id)
      .map((result) => ({
        studentId: result.studentId,
        subjectId: result.subjectId,
        marks: result.isAbsent ? null : result.obtainedMarks,
        remarks: result.remarks,
        isAbsent: result.isAbsent,
      })),
  }
}

/** Written at publish time (`PRD.md` §4.9): totals, percentage, grade and the class rank. */
function rebuildReportCards(examId: string): void {
  for (let index = reportCards.length - 1; index >= 0; index -= 1) {
    if (reportCards[index].examId === examId) reportCards.splice(index, 1)
  }

  const exam = exams.find((item) => item.id === examId)
  if (!exam || exam.kind !== 'EXAM' || !exam.isPublished) return

  const totalMarks = examSubjects
    .filter((paper) => paper.examId === exam.id)
    .reduce((total, paper) => total + paper.maxMarks, 0)
  if (totalMarks === 0) return

  const scored = students
    .filter((student) => student.classId === exam.classId)
    .map((student) => {
      const obtainedMarks = examResults
        .filter((result) => result.examId === exam.id && result.studentId === student.id)
        .reduce((total, result) => total + result.obtainedMarks, 0)

      return { student, obtainedMarks, percentage: Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) }
    })
  const ranked = [...scored].sort((left, right) => right.percentage - left.percentage)

  for (const entry of scored) {
    reportCards.push({
      id: `rc_${exam.id}_${entry.student.id}`,
      schoolId: SCHOOL_ID,
      examId: exam.id,
      studentId: entry.student.id,
      totalMarks,
      obtainedMarks: entry.obtainedMarks,
      percentage: entry.percentage,
      grade: gradeForPercentage(entry.percentage),
      rank: ranked.findIndex((item) => item.student.id === entry.student.id) + 1,
      aiComment: null,
      publishedAt: exam.publishedAt,
    })
  }
}

/**
 * The caller's own week, resolved by role — a teacher's lessons across the classes they teach, or
 * the class of a student. A guardian passes one of their own children, or gets the first of them.
 */
function myTimetableOf(userId: string | null, requestedStudentId = ''): MyTimetable | undefined {
  const user = users.find((item) => item.id === userId)
  if (!user) return undefined

  if (user.role === 'TEACHER') {
    const teacher = findTeacher(user.profileId)
    if (!teacher) return undefined

    // Every class shares one period structure, so the first class speaks for the week's rows.
    const template = timetables[0]
    const periods = template ? labelRows(periodRowsOf(template)) : []

    const days: TeacherTimetableDay[] = weekdays.map((day) => {
      // The demo double-books a teacher by construction, so the first class in a row takes that cell.
      const byRow = new Map<number, { period: Period; classId: string }>()

      for (const item of timetables) {
        if (item.day !== day) continue

        for (const period of periodRowsOf(item)) {
          if (period.isBreak || period.teacherId !== teacher.id) continue
          if (!byRow.has(period.orderIndex)) byRow.set(period.orderIndex, { period, classId: item.classId })
        }
      }

      return {
        day,
        slots: periods.map((row) => {
          const found = byRow.get(row.orderIndex)
          const classRoom = found ? classes.find((room) => room.id === found.classId) : undefined

          return {
            subjectId: found?.period.subjectId ?? null,
            subjectName: found?.period.subjectId ? (findSubject(found.period.subjectId)?.name ?? null) : null,
            classId: found?.classId ?? null,
            className: classRoom ? classLabel(classRoom) : null,
            room: found?.period.room ?? null,
          }
        }),
      }
    })

    const lessons = days.flatMap((day) => day.slots).filter((slot) => slot.subjectId !== null)
    const classIds = new Set(lessons.map((slot) => slot.classId).filter((id): id is string => id !== null))

    return {
      scope: 'TEACHER',
      label: `${teacher.firstName} ${teacher.lastName}`,
      note: `Your week across ${classIds.size} ${classIds.size === 1 ? 'class' : 'classes'}.`,
      periods,
      days,
      stats: {
        weeklyLessons: lessons.length,
        classes: classIds.size,
        subjects: new Set(lessons.map((slot) => slot.subjectName).filter((name) => name !== null)).size,
      },
    }
  }

  // A student's own class, or whichever of a guardian's children they picked.
  const children = (user.role === 'PARENT' ? parentStudents.filter((link) => link.parentId === user.profileId) : [])
    .flatMap((link) => {
      const child = findStudent(link.studentId)
      const childClass = classes.find((room) => room.id === child?.classId)
      if (!child || !childClass) return []

      return [{ studentId: child.id, name: `${child.firstName} ${child.lastName}`, className: classLabel(childClass) }]
    })
    .sort((left, right) => left.className.localeCompare(right.className) || left.name.localeCompare(right.name))

  const ownStudentId = user.role === 'STUDENT' ? (user.profileId ?? '') : ''
  // A guardian may read only their own children; a student only their own record.
  const allowed = ownStudentId ? [ownStudentId] : children.map((child) => child.studentId)
  if (requestedStudentId && !allowed.includes(requestedStudentId)) return undefined

  const chosenId = requestedStudentId || allowed[0] || ''
  const student = chosenId ? findStudent(chosenId) : undefined
  const classRoom = classes.find((room) => room.id === student?.classId)
  const week = classRoom ? classTimetable(classRoom.id) : undefined
  if (!classRoom || !week) return undefined

  return {
    scope: 'CLASS',
    label: classLabel(classRoom),
    note: user.role === 'PARENT' ? "Your child's weekly timetable." : 'Your class timetable.',
    timetable: week,
    children,
  }
}

/** The assistant's read model: the stored turn pair, with its last reply as the result. */
function generationOf(conversation: AiConversation): AiGeneration | undefined {
  const reply = [...conversation.messages].reverse().find((turn) => turn.role === 'assistant')
  if (!reply) return undefined

  return {
    id: conversation.id,
    feature: conversation.feature,
    title: conversation.title ?? 'Untitled generation',
    promptArgs: conversation.promptArgs,
    output: reply.content,
    createdAt: conversation.createdAt,
  }
}

// ---------------------------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------------------------
const routes: Route[] = [
  {
    method: 'POST',
    path: '/auth/login',
    handler: ({ body }) => {
      const email = String(body.email ?? '')
      const password = String(body.password ?? '')
      const user = resolveLogin(email, password)

      if (!user) {
        return fail(401, 'AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect')
      }
      if (!user.isVerified) {
        return fail(403, 'AUTH_NOT_VERIFIED', 'Confirm the link in your invite email before signing in')
      }

      sessionShim.set(REFRESH_KEY, user.id)
      return ok(sessionFor(user))
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: () => {
      const userId = sessionShim.get(REFRESH_KEY)
      const user = users.find((item) => item.id === userId)

      if (!user) return fail(401, 'AUTH_SESSION_EXPIRED', 'Your session has expired. Please sign in again.')
      return ok(sessionFor(user))
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    handler: () => {
      sessionShim.remove(REFRESH_KEY)
      return ok({ loggedOut: true })
    },
  },
  {
    method: 'GET',
    path: '/auth/me',
    handler: ({ userId }) => {
      const user = users.find((item) => item.id === userId)
      if (!user) return fail(401, 'AUTH_UNAUTHENTICATED', 'Not signed in')
      return ok(user)
    },
  },
  {
    method: 'POST',
    path: '/auth/forgot-password',
    handler: ({ body }) => {
      const email = String(body.email ?? '').trim()
      // Never reveal whether an account exists.
      return ok({ email, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() })
    },
  },
  {
    method: 'POST',
    path: '/auth/reset-password',
    handler: ({ body }) => {
      const token = String(body.token ?? '')
      const password = String(body.password ?? '')

      if (token === 'expired') return fail(400, 'AUTH_RESET_TOKEN_INVALID', 'This reset link has expired')
      if (password.length < 8) {
        return fail(400, 'VALIDATION_ERROR', 'Password does not meet the requirements', [
          'password must be at least 8 characters',
        ])
      }

      return ok({ reset: true })
    },
  },
  {
    method: 'POST',
    path: '/schools/register',
    handler: ({ body }) => {
      const email = String(body.email ?? '')
        .trim()
        .toLowerCase()
      const password = String(body.password ?? '')

      if (demoAccounts.some((account) => account.email.toLowerCase() === email) || pendingRegistrations.has(email)) {
        return fail(409, 'SCHOOL_EMAIL_TAKEN', 'That email is already registered')
      }

      pendingRegistrations.set(email, {
        email,
        password,
        firstName: String(body.adminFirstName ?? 'School'),
        lastName: String(body.adminLastName ?? 'Admin'),
      })

      const challenge: OtpChallenge = {
        email,
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      }

      return created({ schoolId: activeSchool.id, email, otp: challenge })
    },
  },
  {
    method: 'POST',
    path: '/schools/verify-otp',
    handler: ({ body }) => {
      const email = String(body.email ?? '')
        .trim()
        .toLowerCase()
      const code = String(body.code ?? '')

      if (code !== OTP_CODE) {
        return fail(400, 'AUTH_OTP_INVALID', `That code is not correct. Use ${OTP_CODE} in the demo.`)
      }

      return ok({ email, verified: true })
    },
  },
  {
    method: 'POST',
    path: '/schools/resend-otp',
    handler: () => ok({ sent: true, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() }),
  },
  {
    method: 'POST',
    path: '/auth/verify-invite',
    handler: ({ body }) => {
      const email = String(body.email ?? '')
        .trim()
        .toLowerCase()
      const code = String(body.code ?? '')
      const user = users.find((item) => item.email.toLowerCase() === email)

      if (!user) return fail(404, 'INVITE_NOT_FOUND', 'No invite for that address', ['email'])
      // Confirming twice is a success, not an error — an emailed link can be opened twice.
      if (user.isVerified) return ok({ verified: true })
      // The invite token is a one-time OTP of purpose `INVITE` (`otps`, Database.md §3).
      if (code !== OTP_CODE) {
        return fail(400, 'INVITE_INVALID', `That code is not correct. Use ${OTP_CODE} in the demo.`)
      }

      user.isVerified = true
      return ok({ verified: true })
    },
  },
  { method: 'GET', path: '/schools/current', handler: () => ok(activeSchool) },
  {
    method: 'GET',
    path: '/subjects',
    handler: ({ params }) =>
      ok(
        subjects.filter(
          (subject) =>
            (!params.classId || subject.classId === params.classId) &&
            (!params.teacherId || subject.teacherId === params.teacherId),
        ),
      ),
  },
  { method: 'GET', path: '/dashboard/admin', handler: () => ok(dashboardSummary) },
  {
    method: 'GET',
    path: '/classes',
    handler: () =>
      ok<ClassOption[]>(
        classes.map((classRoom) => ({
          id: classRoom.id,
          label: classLabel(classRoom),
          grade: classRoom.grade,
          section: classRoom.section,
        })),
      ),
  },
  {
    method: 'GET',
    path: '/teachers',
    handler: ({ params }) => {
      const term = searchTerm(params)

      return ok<TeacherListItem[]>(
        teacherListItems()
          // A soft-deleted teacher keeps their row but leaves the grid.
          .filter((teacher) => teacher.status === 'ACTIVE')
          .filter((teacher) =>
            matches(term, [teacher.firstName, teacher.lastName, teacher.subject, teacher.email, teacher.employeeNo]),
          )
          .sort((left, right) => left.employeeNo.localeCompare(right.employeeNo)),
      )
    },
  },
  {
    method: 'POST',
    path: '/teachers',
    handler: ({ body }) => {
      const fullName = String(body.fullName ?? '').trim()
      const subject = String(body.subject ?? '').trim()
      const email = String(body.email ?? '')
        .trim()
        .toLowerCase()

      if (!fullName) return fail(400, 'TEACHER_INVALID', 'Full name is required', ['fullName'])
      if (!subject) return fail(400, 'TEACHER_INVALID', 'Subject is required', ['subject'])
      if (!email.includes('@')) return fail(400, 'TEACHER_INVALID', 'A valid email is required', ['email'])
      if (users.some((user) => user.email.toLowerCase() === email)) {
        return fail(409, 'TEACHER_EMAIL_TAKEN', 'That email already has an account', ['email'])
      }

      const { firstName, lastName } = fullNameParts(fullName)
      const index = teachers.length + 1
      const password = invitePassword()

      const teacher: Teacher = {
        id: `tch_${index}`,
        schoolId: SCHOOL_ID,
        userId: `usr_tch_${index}`,
        employeeNo: `EMP-${index.toString().padStart(4, '0')}`,
        firstName,
        lastName,
        phone: body.phone ? String(body.phone) : null,
        qualification: body.qualification ? String(body.qualification) : null,
        subject,
        experienceYears: body.experienceYears ? Number(body.experienceYears) : null,
        joinedAt: dateOffset(0),
        status: 'ACTIVE',
      }

      teachers.push(teacher)
      users.push({
        id: teacher.userId,
        email,
        role: 'TEACHER',
        schoolId: SCHOOL_ID,
        // Same invite rule as an enrolment: the login waits for the emailed link.
        isVerified: false,
        profileId: teacher.id,
        firstName,
        lastName,
        classId: null,
      })
      invitedPasswords.set(teacher.userId, password)

      const classIds = Array.isArray(body.classIds) ? (body.classIds as string[]) : []
      for (const classId of classIds) {
        if (classes.some((classRoom) => classRoom.id === classId)) {
          teacherClasses.push({ teacherId: teacher.id, classId })
        }
      }

      const row = teacherListItems().find((item) => item.id === teacher.id)
      if (!row) return fail(404, 'TEACHER_NOT_FOUND', 'Teacher not found')

      return created({ ...row, invite: { email, verificationRequired: true, mockOnlyPassword: password } })
    },
  },
  {
    method: 'PATCH',
    path: '/teachers/:id',
    handler: ({ params, body }) => {
      const teacher = teachers.find((item) => item.id === params.id)
      if (!teacher) return fail(404, 'TEACHER_NOT_FOUND', 'Teacher not found')

      if (body.fullName !== undefined) {
        const { firstName, lastName } = fullNameParts(String(body.fullName))
        teacher.firstName = firstName
        teacher.lastName = lastName
      }
      if (body.subject !== undefined) teacher.subject = String(body.subject)
      if (body.phone !== undefined) teacher.phone = body.phone ? String(body.phone) : null
      if (body.qualification !== undefined) {
        teacher.qualification = body.qualification ? String(body.qualification) : null
      }
      if (body.experienceYears !== undefined) {
        teacher.experienceYears = body.experienceYears ? Number(body.experienceYears) : null
      }

      const user = users.find((item) => item.id === teacher.userId)
      if (user) {
        user.firstName = teacher.firstName
        user.lastName = teacher.lastName

        if (body.email !== undefined) {
          const email = String(body.email).trim().toLowerCase()

          if (!email.includes('@')) return fail(400, 'TEACHER_INVALID', 'A valid email is required', ['email'])
          if (users.some((item) => item.id !== user.id && item.email.toLowerCase() === email)) {
            return fail(409, 'TEACHER_EMAIL_TAKEN', 'That email already has an account', ['email'])
          }

          user.email = email
        }
      }

      if (Array.isArray(body.classIds)) {
        const next = (body.classIds as string[]).filter((classId) =>
          classes.some((classRoom) => classRoom.id === classId),
        )

        // The form sends the set the user ended with, so replace rather than merge.
        for (let index = teacherClasses.length - 1; index >= 0; index -= 1) {
          if (teacherClasses[index].teacherId === teacher.id) teacherClasses.splice(index, 1)
        }
        for (const classId of next) teacherClasses.push({ teacherId: teacher.id, classId })
      }

      return ok(teacherListItems().find((row) => row.id === teacher.id))
    },
  },
  {
    method: 'DELETE',
    path: '/teachers/:id',
    handler: ({ params }) => {
      const teacher = teachers.find((item) => item.id === params.id)
      if (!teacher) return fail(404, 'TEACHER_NOT_FOUND', 'Teacher not found')

      // Soft delete: the row survives for history, the grid stops listing it.
      teacher.status = 'INACTIVE'
      return ok({ deleted: true })
    },
  },
  {
    method: 'GET',
    path: '/students',
    handler: ({ params }) => {
      const term = searchTerm(params)
      const classId = params.classId ? String(params.classId) : ''
      const feeStanding = params.feeStanding ? String(params.feeStanding) : ''

      const filtered = studentListItems()
        // A soft-deleted student keeps their row but leaves the roster.
        .filter((student) => student.status === 'ACTIVE')
        .filter((student) => (classId ? student.classId === classId : true))
        .filter((student) => (feeStanding ? student.feeStanding === feeStanding : true))
        .filter((student) =>
          matches(term, [
            student.firstName,
            student.lastName,
            student.admissionNo,
            student.guardian?.name,
            String(student.rollNo),
          ]),
        )
        // Class order, then roll — the way a register reads.
        .sort((left, right) => left.className.localeCompare(right.className) || left.rollNo - right.rollNo)

      const { items, meta } = paginate(filtered, params)
      return ok(items, meta)
    },
  },
  {
    method: 'POST',
    path: '/students',
    handler: ({ body }) => {
      const firstName = String(body.firstName ?? '').trim()
      const lastName = String(body.lastName ?? '').trim()
      const classId = body.classId ? String(body.classId) : ''
      const guardian = (body.guardian as Guardian | null) ?? null

      if (!firstName || !lastName) {
        return fail(400, 'STUDENT_INVALID', 'First and last name are required', ['firstName', 'lastName'])
      }
      // The student's own address is the login this enrolment provisions.
      if (!String(body.email ?? '').includes('@')) {
        return fail(400, 'STUDENT_INVALID', 'A valid student email is required', ['email'])
      }
      if (users.some((item) => item.email.toLowerCase() === String(body.email).trim().toLowerCase())) {
        return fail(409, 'STUDENT_EMAIL_TAKEN', 'That email already has an account', ['email'])
      }
      if (!classes.some((classRoom) => classRoom.id === classId)) {
        return fail(400, 'STUDENT_INVALID', 'Choose a class for the student', ['classId'])
      }

      // The enrolment form requires every field, so the API does too.
      if (!body.dateOfBirth) return fail(400, 'STUDENT_INVALID', 'Date of birth is required', ['dateOfBirth'])
      if (!body.gender) return fail(400, 'STUDENT_INVALID', 'Gender is required', ['gender'])
      if (!body.bloodGroup) return fail(400, 'STUDENT_INVALID', 'Blood group is required', ['bloodGroup'])
      if (!guardian?.name.trim()) {
        return fail(400, 'STUDENT_INVALID', 'Guardian name is required', ['guardian.name'])
      }
      if (!guardian.email?.trim()) {
        return fail(400, 'STUDENT_INVALID', 'Guardian email is required', ['guardian.email'])
      }
      if (!guardian.phone?.trim()) {
        return fail(400, 'STUDENT_INVALID', 'Guardian phone is required', ['guardian.phone'])
      }
      if (!guardian.address?.trim()) {
        return fail(400, 'STUDENT_INVALID', 'Guardian address is required', ['guardian.address'])
      }

      // Roll numbers are unique per class; leaving it blank takes the next free slot.
      const nextRoll =
        Math.max(0, ...students.filter((item) => item.classId === classId).map((item) => item.rollNo)) + 1
      const rollNo =
        body.rollNo === null || body.rollNo === undefined || body.rollNo === '' ? nextRoll : Number(body.rollNo)

      if (!Number.isInteger(rollNo) || rollNo < 1) {
        return fail(400, 'STUDENT_INVALID', 'Roll number must be a positive whole number', ['rollNo'])
      }
      if (rollTaken(classId, rollNo)) {
        return fail(409, 'STUDENT_ROLL_TAKEN', `Roll ${rollNo} is already taken in that class`, ['rollNo'])
      }

      // Admission number and login are the server's job, exactly as the PRD describes.
      const index = students.length + 1
      const student: Student = {
        id: `std_${index}`,
        schoolId: SCHOOL_ID,
        userId: `usr_std_${index}`,
        admissionNo: `ADM-${index.toString().padStart(4, '0')}`,
        firstName,
        lastName,
        dateOfBirth: body.dateOfBirth ? String(body.dateOfBirth) : null,
        gender: (body.gender as Gender | undefined) ?? null,
        bloodGroup: (body.bloodGroup as BloodGroup | undefined) ?? null,
        classId,
        rollNo,
        status: 'ACTIVE',
      }

      const email = String(body.email).trim().toLowerCase()
      const password = invitePassword()

      students.push(student)
      users.push({
        id: student.userId,
        email,
        role: 'STUDENT',
        schoolId: SCHOOL_ID,
        // The invite flow: the login exists from the start, but only the emailed link verifies it.
        isVerified: false,
        profileId: student.id,
        firstName,
        lastName,
        classId,
      })
      invitedPasswords.set(student.userId, password)
      upsertGuardian(student, guardian)

      const row = studentListItems().find((item) => item.id === student.id)
      if (!row) return fail(404, 'STUDENT_NOT_FOUND', 'Student not found')

      return created({
        ...row,
        invite: { email, verificationRequired: true, mockOnlyPassword: password },
      })
    },
  },
  {
    method: 'PATCH',
    path: '/students/:id',
    handler: ({ params, body }) => {
      const student = students.find((item) => item.id === params.id)
      if (!student) return fail(404, 'STUDENT_NOT_FOUND', 'Student not found')

      if (body.firstName !== undefined) student.firstName = String(body.firstName).trim()
      if (body.lastName !== undefined) student.lastName = String(body.lastName).trim()
      if (body.classId !== undefined) student.classId = String(body.classId)
      if (body.dateOfBirth !== undefined) student.dateOfBirth = body.dateOfBirth ? String(body.dateOfBirth) : null
      if (body.gender !== undefined) student.gender = (body.gender as Gender | null) ?? null
      if (body.bloodGroup !== undefined) student.bloodGroup = (body.bloodGroup as BloodGroup | null) ?? null

      // Checked against the class the student is in now, which may be the one just set above.
      if (body.rollNo !== undefined) {
        const rollNo = body.rollNo === null || body.rollNo === '' ? student.rollNo : Number(body.rollNo)

        if (!Number.isInteger(rollNo) || rollNo < 1) {
          return fail(400, 'STUDENT_INVALID', 'Roll number must be a positive whole number', ['rollNo'])
        }
        if (rollTaken(student.classId ?? '', rollNo, student.id)) {
          return fail(409, 'STUDENT_ROLL_TAKEN', `Roll ${rollNo} is already taken in that class`, ['rollNo'])
        }

        student.rollNo = rollNo
      }

      if (body.guardian !== undefined) upsertGuardian(student, (body.guardian as Guardian | null) ?? null)

      // The login record mirrors the profile name, so keep the two in step.
      const user = users.find((item) => item.id === student.userId)
      if (user) {
        user.firstName = student.firstName
        user.lastName = student.lastName
        user.classId = student.classId

        if (body.email !== undefined) {
          const email = String(body.email).trim().toLowerCase()

          if (!email.includes('@')) {
            return fail(400, 'STUDENT_INVALID', 'A valid student email is required', ['email'])
          }
          if (users.some((item) => item.id !== user.id && item.email.toLowerCase() === email)) {
            return fail(409, 'STUDENT_EMAIL_TAKEN', 'That email already has an account', ['email'])
          }

          user.email = email
        }
      }

      return ok(studentListItems().find((row) => row.id === student.id))
    },
  },
  {
    method: 'DELETE',
    path: '/students/:id',
    handler: ({ params }) => {
      const student = students.find((item) => item.id === params.id)
      if (!student) return fail(404, 'STUDENT_NOT_FOUND', 'Student not found')

      // Soft delete (PRD §4.3): the row survives for history, the roster stops listing it.
      student.status = 'INACTIVE'
      return ok({ deleted: true })
    },
  },
  {
    method: 'GET',
    path: '/students/:id',
    handler: ({ params }) => {
      const profile = studentProfile(String(params.id))
      return profile ? ok(profile) : fail(404, 'STUDENT_NOT_FOUND', 'Student not found')
    },
  },
  {
    method: 'GET',
    path: '/students/:id/documents',
    // No upload flow exists yet, so this is honestly empty and the tab renders its empty state.
    handler: ({ params }) =>
      students.some((item) => item.id === params.id)
        ? ok<StudentDocument[]>([])
        : fail(404, 'STUDENT_NOT_FOUND', 'Student not found'),
  },
  {
    method: 'GET',
    path: '/attendance/student/:studentId',
    handler: ({ params }) => {
      if (!students.some((item) => item.id === params.studentId)) {
        return fail(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      const summary = studentAttendance(String(params.studentId))

      return ok<StudentAttendance>(
        summary ?? { totals: { total: 0, present: 0, absent: 0, late: 0, rate: 0 }, months: [] },
      )
    },
  },
  {
    method: 'GET',
    path: '/results/student/:studentId',
    handler: ({ params }) => {
      if (!students.some((item) => item.id === params.studentId)) {
        return fail(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // A student with no papers yet gets an empty result set, not a 404.
      return ok<StudentResults>(studentResults(String(params.studentId)))
    },
  },
  {
    method: 'GET',
    path: '/fees/history/:studentId',
    handler: ({ params }) => ok<StudentFees>(studentFees(String(params.studentId))),
  },
  {
    method: 'GET',
    path: '/notices',
    handler: ({ params }) => {
      const term = searchTerm(params)

      const filtered = notices
        .filter((notice) => notice.deletedAt === null)
        .filter((notice) => matches(term, [notice.title, notice.body]))
        .sort((left, right) => (right.publishedAt ?? '').localeCompare(left.publishedAt ?? ''))

      const { items, meta } = paginate(filtered, params)
      return ok<Notice[]>(items, meta)
    },
  },
  {
    method: 'POST',
    path: '/notices',
    handler: ({ body, userId }) => {
      const title = String(body.title ?? '').trim()
      const text = String(body.body ?? '').trim()
      const priority = String(body.priority ?? 'MEDIUM')

      if (!title) return fail(400, 'NOTICE_INVALID', 'A title is required', ['title'])
      if (!text) return fail(400, 'NOTICE_INVALID', 'A description is required', ['body'])
      if (!NOTICE_PRIORITY_VALUES.includes(priority as NoticePriority)) {
        return fail(400, 'NOTICE_INVALID', 'Choose a priority', ['priority'])
      }

      const user = users.find((item) => item.id === userId)
      const byline = user ? `${user.firstName} ${user.lastName}`.trim() : 'School office'
      const requestedByline = String(body.authorName ?? '').trim()

      const notice: Notice = {
        id: `not_${notices.length + 1}`,
        schoolId: SCHOOL_ID,
        publishedById: userId ?? 'usr_admin_1',
        title,
        body: text,
        priority: priority as NoticePriority,
        // The board form targets every role; class narrowing stays a server-side concern.
        audience: ['ALL'],
        publishedAt: new Date().toISOString(),
        expiresAt: null,
        classIds: [],
        authorName: requestedByline || byline,
        deletedAt: null,
      }

      notices.push(notice)
      return created(notice)
    },
  },
  {
    method: 'PATCH',
    path: '/notices/:id',
    handler: ({ params, body }) => {
      const notice = notices.find((item) => item.id === params.id && item.deletedAt === null)
      if (!notice) return fail(404, 'NOTICE_NOT_FOUND', 'Notice not found')

      if (body.title !== undefined) {
        const title = String(body.title).trim()
        if (!title) return fail(400, 'NOTICE_INVALID', 'A title is required', ['title'])
        notice.title = title
      }

      if (body.body !== undefined) {
        const text = String(body.body).trim()
        if (!text) return fail(400, 'NOTICE_INVALID', 'A description is required', ['body'])
        notice.body = text
      }

      if (body.priority !== undefined) {
        const priority = String(body.priority)
        if (!NOTICE_PRIORITY_VALUES.includes(priority as NoticePriority)) {
          return fail(400, 'NOTICE_INVALID', 'Choose a priority', ['priority'])
        }
        notice.priority = priority as NoticePriority
      }

      if (body.authorName !== undefined) {
        const byline = String(body.authorName).trim()
        if (byline) notice.authorName = byline
      }

      // The board has no "save as draft": editing a draft publishes it.
      if (notice.publishedAt === null) notice.publishedAt = new Date().toISOString()

      return ok(notice)
    },
  },
  {
    method: 'DELETE',
    path: '/notices/:id',
    handler: ({ params }) => {
      const notice = notices.find((item) => item.id === params.id && item.deletedAt === null)
      if (!notice) return fail(404, 'NOTICE_NOT_FOUND', 'Notice not found')

      // Soft delete (Database.md §11): the row survives, the board stops listing it.
      notice.deletedAt = new Date().toISOString()
      return ok({ deleted: true })
    },
  },
  {
    method: 'GET',
    path: '/homework',
    handler: ({ params, userId }) => {
      const user = users.find((item) => item.id === userId)
      const term = searchTerm(params)
      const classId = params.classId ? String(params.classId) : ''
      const subjectId = params.subjectId ? String(params.subjectId) : ''
      const status = params.status ? String(params.status) : ''

      const filtered = homeworkListItems()
        .filter((assignment) => homeworkVisibleTo(assignment, user))
        .filter((assignment) => (classId ? assignment.classId === classId : true))
        .filter((assignment) => (subjectId ? assignment.subjectId === subjectId : true))
        .filter((assignment) => (status ? assignment.status === status : true))
        .filter((assignment) =>
          matches(term, [
            assignment.title,
            assignment.subjectName,
            assignment.className,
            assignment.teacherName,
            assignment.description,
          ]),
        )
        // Soonest due first, so the grid reads as a to-do queue.
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.title.localeCompare(right.title))

      return ok<HomeworkListItem[]>(filtered)
    },
  },
  {
    method: 'POST',
    path: '/homework',
    handler: ({ body, userId }) => {
      const classId = String(body.classId ?? '')
      const subjectId = String(body.subjectId ?? '')
      const title = String(body.title ?? '').trim()
      const dueDate = String(body.dueDate ?? '')

      if (!classes.some((classRoom) => classRoom.id === classId)) {
        return fail(400, 'HOMEWORK_INVALID', 'Choose a class for the assignment', ['classId'])
      }

      const subject = findSubject(subjectId)
      if (!subject) return fail(400, 'HOMEWORK_INVALID', 'Choose a subject for the assignment', ['subjectId'])
      if (subject.classId !== classId) {
        return fail(400, 'HOMEWORK_INVALID', 'That subject is not taught in the chosen class', ['subjectId'])
      }
      if (!title) return fail(400, 'HOMEWORK_INVALID', 'A title is required', ['title'])
      if (!dueDate) return fail(400, 'HOMEWORK_INVALID', 'A due date is required', ['dueDate'])

      const maxMarks =
        body.maxMarks === null || body.maxMarks === undefined || body.maxMarks === '' ? null : Number(body.maxMarks)
      if (maxMarks !== null && (!Number.isFinite(maxMarks) || maxMarks <= 0)) {
        return fail(400, 'HOMEWORK_INVALID', 'Max marks must be greater than zero', ['maxMarks'])
      }

      // The author of record: a teacher's own profile, or the subject's teacher when an admin assigns
      // on their behalf.
      const user = users.find((item) => item.id === userId)
      const teacherId = user?.role === 'TEACHER' && user.profileId ? user.profileId : (subject.teacherId ?? 'tch_1')

      const assignment: Homework = {
        id: `hw_${homework.length + 1}`,
        schoolId: SCHOOL_ID,
        classId,
        subjectId,
        teacherId,
        title,
        description: body.description ? String(body.description) : null,
        dueDate,
        maxMarks,
        attachments: [],
        deletedAt: null,
      }

      homework.push(assignment)
      return created(homeworkListItems().find((row) => row.id === assignment.id))
    },
  },
  {
    method: 'PATCH',
    path: '/homework/:id',
    handler: ({ params, body }) => {
      const assignment = homework.find((item) => item.id === params.id && item.deletedAt === null)
      if (!assignment) return fail(404, 'HOMEWORK_NOT_FOUND', 'Assignment not found')

      // Resolve the pair before writing: a class-only change must not leave the assignment holding a
      // subject from the class it just left, and neither field is written until the two agree.
      const classId = body.classId === undefined ? assignment.classId : String(body.classId)
      const subjectId = body.subjectId === undefined ? assignment.subjectId : String(body.subjectId)

      if (!classes.some((classRoom) => classRoom.id === classId)) {
        return fail(400, 'HOMEWORK_INVALID', 'Choose a class for the assignment', ['classId'])
      }

      const subject = findSubject(subjectId)
      if (!subject) return fail(400, 'HOMEWORK_INVALID', 'Choose a subject for the assignment', ['subjectId'])
      if (subject.classId !== classId) {
        return fail(400, 'HOMEWORK_INVALID', 'That subject is not taught in the chosen class', ['subjectId'])
      }

      assignment.classId = classId
      assignment.subjectId = subjectId

      if (body.title !== undefined) {
        const title = String(body.title).trim()
        if (!title) return fail(400, 'HOMEWORK_INVALID', 'A title is required', ['title'])
        assignment.title = title
      }

      if (body.description !== undefined) {
        assignment.description = body.description ? String(body.description) : null
      }

      if (body.dueDate !== undefined) {
        const dueDate = String(body.dueDate)
        if (!dueDate) return fail(400, 'HOMEWORK_INVALID', 'A due date is required', ['dueDate'])
        assignment.dueDate = dueDate
      }

      if (body.maxMarks !== undefined) {
        const maxMarks = body.maxMarks === null || body.maxMarks === '' ? null : Number(body.maxMarks)
        if (maxMarks !== null && (!Number.isFinite(maxMarks) || maxMarks <= 0)) {
          return fail(400, 'HOMEWORK_INVALID', 'Max marks must be greater than zero', ['maxMarks'])
        }
        assignment.maxMarks = maxMarks
      }

      return ok(homeworkListItems().find((row) => row.id === assignment.id))
    },
  },
  {
    method: 'DELETE',
    path: '/homework/:id',
    handler: ({ params }) => {
      const assignment = homework.find((item) => item.id === params.id && item.deletedAt === null)
      if (!assignment) return fail(404, 'HOMEWORK_NOT_FOUND', 'Assignment not found')

      // Soft delete (Database.md §6): the row survives so submissions keep their parent.
      assignment.deletedAt = new Date().toISOString()
      return ok({ deleted: true })
    },
  },
  {
    method: 'GET',
    path: '/fees/invoices',
    handler: ({ params }) => {
      const term = searchTerm(params)
      const status = params.status ? String(params.status) : ''
      const classId = params.classId ? String(params.classId) : ''

      const filtered = invoiceListItems()
        .filter((invoice) => (status ? invoice.status === status : true))
        .filter((invoice) => (classId ? findStudent(invoice.studentId)?.classId === classId : true))
        .filter((invoice) =>
          matches(term, [
            invoice.studentName,
            invoice.admissionNo,
            invoice.receiptNo,
            invoice.className,
            invoice.title,
          ]),
        )
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate))

      const { items, meta } = paginate(filtered, params)
      return ok(items, meta)
    },
  },
  {
    method: 'GET',
    path: '/fees/pending',
    handler: ({ params }) => {
      const classId = params.classId ? String(params.classId) : ''
      const filtered = pendingInvoiceRows().filter((row) =>
        classId ? findStudent(row.studentId)?.classId === classId : true,
      )

      const { items, meta } = paginate(filtered, params)
      return ok(items, meta)
    },
  },
  { method: 'GET', path: '/fees/summary', handler: () => ok<FeeCollectionSummary>(feeCollectionSummary()) },
  { method: 'GET', path: '/fees/dashboard', handler: () => ok<FeeDashboard>(feeDashboard()) },
  {
    method: 'GET',
    path: '/fees/structures',
    handler: ({ params }) =>
      ok<FeeStructureDetail[]>(feeStructureDetails(params.classId ? String(params.classId) : '')),
  },
  {
    method: 'POST',
    path: '/fees/heads',
    handler: ({ body }) => {
      const classId = String(body.classId ?? '')
      const title = String(body.title ?? '').trim()
      const amountPaise = Number(body.amountPaise ?? 0)
      const dueDate = String(body.dueDate ?? '')

      if (!classes.some((classRoom) => classRoom.id === classId)) {
        return fail(400, 'FEE_VALIDATION', 'Choose a class for the fee head', ['classId'])
      }
      if (!title) return fail(400, 'FEE_VALIDATION', 'A title is required', ['title'])
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        return fail(400, 'FEE_VALIDATION', 'Amount must be greater than zero', ['amountPaise'])
      }
      if (!dueDate) return fail(400, 'FEE_VALIDATION', 'A due date is required', ['dueDate'])

      const structure = structureForClass(classId)
      const duplicate = feeHeads.some(
        (head) => head.feeStructureId === structure.id && head.name.toLowerCase() === title.toLowerCase(),
      )
      if (duplicate) return fail(409, 'FEE_HEAD_EXISTS', 'That head already exists for this class', ['title'])

      const head: FeeHead = {
        id: `fhd_${structure.id}_${feeHeads.length + 1}`,
        schoolId: SCHOOL_ID,
        feeStructureId: structure.id,
        name: title,
        amountPaise,
        frequency: (body.frequency ? String(body.frequency) : 'ONE_TIME') as FeeHead['frequency'],
        dueDate,
        description: body.description ? String(body.description) : null,
      }

      feeHeads.push(head)
      return created(feeStructureDetails(classId)[0])
    },
  },
  {
    method: 'PATCH',
    path: '/fees/heads/:id',
    handler: ({ params, body }) => {
      const head = findFeeHead(String(params.id))
      if (!head) return fail(404, 'FEE_HEAD_NOT_FOUND', 'Fee head not found')

      if (body.title !== undefined) head.name = String(body.title).trim()
      if (body.amountPaise !== undefined) head.amountPaise = Number(body.amountPaise)
      if (body.frequency !== undefined) head.frequency = String(body.frequency) as FeeHead['frequency']
      if (body.dueDate !== undefined) head.dueDate = String(body.dueDate)
      if (body.description !== undefined) head.description = body.description ? String(body.description) : null

      return ok(head)
    },
  },
  {
    method: 'DELETE',
    path: '/fees/heads/:id',
    handler: ({ params }) => {
      const index = feeHeads.findIndex((head) => head.id === params.id)
      if (index < 0) return fail(404, 'FEE_HEAD_NOT_FOUND', 'Fee head not found')

      feeHeads.splice(index, 1)
      return ok({ deleted: true })
    },
  },
  {
    method: 'GET',
    path: '/fees/collect/summary',
    handler: ({ params }) =>
      ok<FeeCollectSummary>(
        feeCollectSummary(params.classId ? String(params.classId) : '', params.status ? String(params.status) : ''),
      ),
  },
  {
    method: 'GET',
    path: '/fees/collect/students',
    handler: ({ params }) => {
      const rows = classFeeStatusRows(
        params.classId ? String(params.classId) : '',
        params.status ? String(params.status) : '',
      )
      const { items, meta } = paginate(rows, params)
      return ok(items, meta)
    },
  },
  {
    method: 'GET',
    path: '/fees/collect/student/:studentId',
    handler: ({ params }) => {
      const summary = studentCollectSummary(String(params.studentId))
      return summary ? ok(summary) : fail(404, 'STUDENT_NOT_FOUND', 'Student not found')
    },
  },
  {
    method: 'POST',
    path: '/fees/invoices',
    handler: ({ body }) => {
      const studentId = String(body.studentId ?? '')
      const feeHeadId = String(body.feeHeadId ?? '')
      const student = findStudent(studentId)
      if (!student) return fail(404, 'STUDENT_NOT_FOUND', 'Student not found')

      const head = findFeeHead(feeHeadId)
      if (!head) return fail(404, 'FEE_HEAD_NOT_FOUND', 'Fee head not found')

      const structure = structureForClass(student.classId)
      if (head.feeStructureId !== structure.id) {
        return fail(400, 'FEE_VALIDATION', "That head does not belong to the student's class", ['feeHeadId'])
      }
      if (feeInvoices.some((invoice) => invoice.studentId === studentId && invoice.feeHeadId === feeHeadId)) {
        return fail(409, 'FEE_INVOICE_EXISTS', 'An invoice for that head already exists', ['feeHeadId'])
      }

      const invoice: FeeInvoice = {
        id: `inv_${studentId}_${feeHeadId}`,
        schoolId: SCHOOL_ID,
        studentId,
        feeStructureId: structure.id,
        feeHeadId,
        amountPaise: head.amountPaise,
        discountPaise: concessionAmountFor(studentId, head),
        paidPaise: 0,
        dueDate: body.dueDate ? String(body.dueDate) : head.dueDate,
        status: 'PENDING',
        receiptNo: null,
        issuedAt: new Date().toISOString(),
        notes: body.notes ? String(body.notes) : null,
      }

      feeInvoices.push(invoice)
      return created(studentCollectSummary(studentId))
    },
  },
  {
    method: 'POST',
    path: '/fees/payments/manual',
    handler: ({ body, userId }) => {
      const invoice = findFeeInvoice(String(body.invoiceId ?? ''))
      if (!invoice) return fail(404, 'FEE_INVOICE_NOT_FOUND', 'Invoice not found')

      const amountPaise = Number(body.amountPaise ?? 0)
      const balance = outstanding(invoice)

      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        return fail(400, 'FEE_VALIDATION', 'Enter an amount greater than zero', ['amountPaise'])
      }
      if (amountPaise > balance) {
        return fail(400, 'FEE_VALIDATION', 'The amount is more than the balance on this invoice', ['amountPaise'])
      }

      const student = findStudent(invoice.studentId)
      const classSeq = classes.findIndex((classRoom) => classRoom.id === student?.classId) + 1

      if (invoice.receiptNo === null) {
        manualReceiptSeq += 1
        invoice.receiptNo = `RCP-SCH-${ACADEMIC_YEAR}-${String(classSeq).padStart(4, '0')}-${String(manualReceiptSeq).padStart(5, '0')}`
      }

      const payment: FeePayment = {
        id: `pay_${invoice.id}_${feePayments.length + 1}`,
        schoolId: SCHOOL_ID,
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        recordedById: userId,
        amountPaise,
        provider: 'MANUAL',
        method: (body.method ? String(body.method) : 'CASH') as PaymentMethod,
        providerOrderId: null,
        providerTxnId: null,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        remarks: body.remarks ? String(body.remarks) : null,
      }

      feePayments.push(payment)
      invoice.paidPaise += amountPaise
      invoice.status = outstanding(invoice) === 0 ? 'PAID' : 'PARTIAL'

      return created(receiptFor(payment.id))
    },
  },
  {
    method: 'GET',
    path: '/fees/payments/:id/receipt',
    handler: ({ params }) => {
      const receipt = receiptFor(String(params.id))
      return receipt ? ok(receipt) : fail(404, 'FEE_PAYMENT_NOT_FOUND', 'Payment not found')
    },
  },
  {
    method: 'GET',
    path: '/fees/reports/day-book',
    handler: ({ params }) => ok<DayBook>(dayBookReport(params.date ? String(params.date) : '')),
  },
  {
    method: 'GET',
    path: '/fees/reports/class',
    handler: ({ params }) => ok<ClassReportRow[]>(classReportRows(params.classId ? String(params.classId) : '')),
  },
  {
    method: 'GET',
    path: '/fees/reports/defaulters',
    handler: ({ params }) => ok<DefaulterRow[]>(defaulterRows(params.classId ? String(params.classId) : '')),
  },
  {
    method: 'GET',
    path: '/fees/reports/student-ledger',
    handler: ({ params }) => ok<StudentLedger>(studentLedger(String(params.studentId ?? ''))),
  },
  {
    method: 'GET',
    path: '/fees/concessions',
    handler: ({ params }) => {
      const term = searchTerm(params)
      const status = params.status ? String(params.status) : ''

      const filtered = concessionRows()
        .filter((row) => (status ? row.status === status : true))
        .filter((row) => matches(term, [row.studentName, row.className, row.feeHeadTitle, row.reason]))

      return ok(filtered)
    },
  },
  {
    method: 'POST',
    path: '/fees/concessions',
    handler: ({ body, userId }) => {
      const studentId = String(body.studentId ?? '')
      if (!findStudent(studentId)) return fail(400, 'FEE_VALIDATION', 'Choose a student', ['studentId'])

      const type = (body.type ? String(body.type) : 'PERCENTAGE') as ConcessionType
      const percentage = body.percentage === null || body.percentage === undefined ? null : Number(body.percentage)
      const amountPaise = body.amountPaise === null || body.amountPaise === undefined ? null : Number(body.amountPaise)

      if (type === 'PERCENTAGE' && (percentage === null || percentage <= 0 || percentage > 100)) {
        return fail(400, 'FEE_VALIDATION', 'Enter a percentage between 1 and 100', ['percentage'])
      }
      if (type === 'FIXED' && (amountPaise === null || amountPaise <= 0)) {
        return fail(400, 'FEE_VALIDATION', 'Enter an amount greater than zero', ['amountPaise'])
      }

      const feeHeadId = body.feeHeadId ? String(body.feeHeadId) : null
      if (feeHeadId && !findFeeHead(feeHeadId)) {
        return fail(400, 'FEE_VALIDATION', 'That fee head does not exist', ['feeHeadId'])
      }

      const concession: Concession = {
        id: `con_${concessions.length + 1}`,
        schoolId: SCHOOL_ID,
        studentId,
        feeHeadId,
        category: (body.category ? String(body.category) : 'CUSTOM') as ConcessionCategory,
        type,
        percentage: type === 'PERCENTAGE' ? percentage : null,
        amountPaise: type === 'FIXED' ? amountPaise : null,
        reason: body.reason ? String(body.reason) : null,
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date().toISOString(),
      }

      concessions.push(concession)
      return created(concessionRows().find((row) => row.id === concession.id))
    },
  },
  {
    method: 'PATCH',
    path: '/fees/concessions/:id',
    handler: ({ params, body }) => {
      const concession = concessions.find((item) => item.id === params.id)
      if (!concession) return fail(404, 'FEE_CONCESSION_NOT_FOUND', 'Concession not found')

      if (body.studentId !== undefined) concession.studentId = String(body.studentId)
      if (body.feeHeadId !== undefined) concession.feeHeadId = body.feeHeadId ? String(body.feeHeadId) : null
      if (body.category !== undefined) concession.category = String(body.category) as ConcessionCategory
      if (body.type !== undefined) concession.type = String(body.type) as ConcessionType
      if (body.percentage !== undefined) {
        concession.percentage = body.percentage === null ? null : Number(body.percentage)
      }
      if (body.amountPaise !== undefined) {
        concession.amountPaise = body.amountPaise === null ? null : Number(body.amountPaise)
      }
      if (body.reason !== undefined) concession.reason = body.reason ? String(body.reason) : null

      return ok(concessionRows().find((row) => row.id === concession.id))
    },
  },
  {
    method: 'DELETE',
    path: '/fees/concessions/:id',
    handler: ({ params }) => {
      const index = concessions.findIndex((item) => item.id === params.id)
      if (index < 0) return fail(404, 'FEE_CONCESSION_NOT_FOUND', 'Concession not found')

      concessions.splice(index, 1)
      return ok({ deleted: true })
    },
  },
  {
    method: 'GET',
    path: '/timetables/class/:classId',
    handler: ({ params }) => {
      const timetable = classTimetable(String(params.classId))
      return timetable ? ok(timetable) : fail(404, 'TIMETABLE_NOT_FOUND', 'Class not found')
    },
  },
  {
    method: 'PATCH',
    path: '/timetables/class/:classId/slots',
    handler: ({ params, body }) => {
      const classRoom = classes.find((item) => item.id === params.classId)
      if (!classRoom) return fail(404, 'TIMETABLE_NOT_FOUND', 'Class not found')

      const day = String(body.day ?? '') as Weekday
      if (!weekdays.includes(day)) return fail(400, 'TIMETABLE_INVALID', 'Choose a day of the week', ['day'])

      const orderIndex = Number(body.orderIndex)
      const row = periodRowsOf(dayTimetableOf(classRoom.id, day)).find((item) => item.orderIndex === orderIndex)
      if (!row) return fail(404, 'TIMETABLE_PERIOD_NOT_FOUND', 'That period does not exist on this day')
      if (row.isBreak) return fail(400, 'TIMETABLE_INVALID', 'A break row holds no lesson', ['orderIndex'])

      const subjectId = body.subjectId ? String(body.subjectId) : null
      const teacherId = body.teacherId ? String(body.teacherId) : null

      if (subjectId) {
        const subject = findSubject(subjectId)
        if (!subject) return fail(400, 'TIMETABLE_INVALID', 'That subject does not exist', ['subjectId'])
        if (subject.classId !== classRoom.id) {
          return fail(400, 'TIMETABLE_INVALID', 'That subject is not taught in this class', ['subjectId'])
        }
      }

      if (teacherId && !teachers.some((teacher) => teacher.id === teacherId && teacher.status === 'ACTIVE')) {
        return fail(400, 'TIMETABLE_INVALID', 'That teacher is not on the staff list', ['teacherId'])
      }

      // Both null clears the cell, which is what the editor's Clear does.
      row.subjectId = subjectId
      row.teacherId = teacherId

      return ok(classTimetable(classRoom.id))
    },
  },
  {
    method: 'POST',
    path: '/timetables/class/:classId/periods',
    handler: ({ params, body }) => {
      const classRoom = classes.find((item) => item.id === params.classId)
      if (!classRoom) return fail(404, 'TIMETABLE_NOT_FOUND', 'Class not found')

      const label = String(body.label ?? '').trim()
      const startTime = String(body.startTime ?? '')
      const endTime = String(body.endTime ?? '')
      const isBreak = Boolean(body.isBreak)

      if (!label) return fail(400, 'TIMETABLE_INVALID', 'A label is required', ['label'])
      if (!startTime) return fail(400, 'TIMETABLE_INVALID', 'A start time is required', ['startTime'])
      if (!endTime) return fail(400, 'TIMETABLE_INVALID', 'An end time is required', ['endTime'])
      if (endTime <= startTime) {
        return fail(400, 'TIMETABLE_INVALID', 'The end time must come after the start time', ['endTime'])
      }

      // The row belongs to the class, so every day gains it in the same pass.
      for (const day of weekdays) {
        const timetable = dayTimetableOf(classRoom.id, day)
        const nextIndex = periodRowsOf(timetable).reduce((max, row) => Math.max(max, row.orderIndex + 1), 0)

        periods.push({
          id: `per_${timetable.id}_${nextIndex + 1}`,
          schoolId: SCHOOL_ID,
          timetableId: timetable.id,
          subjectId: null,
          teacherId: null,
          startTime,
          endTime,
          isBreak,
          orderIndex: nextIndex,
          room: null,
          label,
        })
      }

      return created(classTimetable(classRoom.id))
    },
  },
  {
    method: 'DELETE',
    path: '/timetables/class/:classId/periods/:orderIndex',
    handler: ({ params }) => {
      const classRoom = classes.find((item) => item.id === params.classId)
      if (!classRoom) return fail(404, 'TIMETABLE_NOT_FOUND', 'Class not found')

      const orderIndex = Number(params.orderIndex)
      const dayRows = weekdays.map((day) => periodRowsOf(dayTimetableOf(classRoom.id, day)))

      if (dayRows.some((rows) => !rows.some((row) => row.orderIndex === orderIndex))) {
        return fail(404, 'TIMETABLE_PERIOD_NOT_FOUND', 'That period does not exist')
      }
      if (dayRows[0].length <= 1) {
        return fail(400, 'TIMETABLE_INVALID', 'A week needs at least one period row')
      }

      for (const day of weekdays) {
        const timetable = dayTimetableOf(classRoom.id, day)
        const target = periodRowsOf(timetable).find((row) => row.orderIndex === orderIndex)
        if (!target) continue

        periods.splice(periods.indexOf(target), 1)
        // Keep positions contiguous — a numbered row reads its number from where it sits.
        periodRowsOf(timetable).forEach((row, position) => {
          row.orderIndex = position
        })
      }

      return ok(classTimetable(classRoom.id))
    },
  },
  {
    method: 'GET',
    path: '/chat/conversations',
    handler: ({ userId }) => ok<ConversationListItem[]>(conversationListItems(userId)),
  },
  {
    method: 'GET',
    path: '/chat/:conversationId/messages',
    handler: ({ params, userId }) => {
      const conversation = conversations.find((item) => item.id === params.conversationId)
      if (!conversation) return fail(404, 'CHAT_CONVERSATION_NOT_FOUND', 'Conversation not found')
      if (!conversation.participantIds.includes(String(userId))) {
        return fail(403, 'CHAT_NOT_A_PARTICIPANT', 'You are not part of this conversation')
      }

      return ok<ChatMessageListItem[]>(conversationMessages(String(params.conversationId), String(userId)))
    },
  },
  {
    method: 'GET',
    path: '/permissions',
    handler: () => ok<PermissionGroupRow[]>(permissionGroups()),
  },
  {
    method: 'GET',
    path: '/permissions/staff',
    handler: () => ok<StaffPermissionRow[]>(staffPermissionRows()),
  },
  {
    method: 'GET',
    path: '/users/:userId/permissions',
    handler: ({ params }) => {
      const summary = userPermissionSummary(String(params.userId))
      return summary ? ok(summary) : fail(404, 'USER_NOT_FOUND', 'User not found')
    },
  },
  {
    method: 'PUT',
    path: '/users/:userId/permissions',
    handler: ({ params, body, userId }) => {
      const user = users.find((item) => item.id === params.userId)
      if (!user) return fail(404, 'USER_NOT_FOUND', 'User not found')

      const submitted = Array.isArray(body.keys) ? (body.keys as string[]) : []
      const catalogue = new Map(permissions.map((permission) => [permission.key, permission]))
      const unknown = submitted.find((key) => !catalogue.has(key))

      if (unknown) return fail(400, 'PERMISSION_INVALID', `${unknown} is not a known permission`, ['keys'])

      // `PUT` replaces the set, so this user's rows go and the submitted ones are written instead.
      for (let index = userPermissions.length - 1; index >= 0; index -= 1) {
        if (userPermissions[index].userId === user.id) userPermissions.splice(index, 1)
      }

      for (const key of new Set(submitted)) {
        const permission = catalogue.get(key)
        if (!permission) continue

        userPermissions.push({
          id: `upm_${user.id}_${permission.id}_${userPermissions.length + 1}`,
          schoolId: SCHOOL_ID,
          userId: user.id,
          permissionId: permission.id,
          grantedById: userId,
          createdAt: new Date().toISOString(),
        })
      }

      const summary = userPermissionSummary(user.id)
      return summary ? ok(summary) : fail(404, 'USER_NOT_FOUND', 'User not found')
    },
  },
  {
    method: 'GET',
    path: '/exams',
    handler: ({ params }) => {
      const kind = params.kind ? String(params.kind) : 'EXAM'
      const classId = params.classId ? String(params.classId) : ''
      const subjectId = params.subjectId ? String(params.subjectId) : ''

      if (kind === 'TEST') {
        return ok<TestListItem[]>(
          testListItems()
            .filter((test) => (classId ? test.classId === classId : true))
            .filter((test) => (subjectId ? test.subjectId === subjectId : true)),
        )
      }

      return ok<ExamListItem[]>(examListItems().filter((exam) => (classId ? exam.classId === classId : true)))
    },
  },
  {
    method: 'POST',
    path: '/exams',
    handler: ({ body }) => {
      const kind = (body.kind ? String(body.kind) : 'EXAM') as ExamKind
      const classId = String(body.classId ?? '')
      const name = String(body.name ?? '').trim()

      if (!classes.some((item) => item.id === classId)) {
        return fail(400, 'EXAM_INVALID', 'Choose a class', ['classId'])
      }
      if (!name) return fail(400, 'EXAM_INVALID', 'A title is required', ['name'])

      if (kind === 'TEST') {
        const subjectId = String(body.subjectId ?? '')
        if (!subjects.some((item) => item.id === subjectId && item.classId === classId)) {
          return fail(400, 'EXAM_INVALID', 'Choose a subject taught in that class', ['subjectId'])
        }

        const examDate = String(body.examDate ?? '')
        if (!examDate) return fail(400, 'EXAM_INVALID', 'A date is required', ['examDate'])

        const maxMarks = Number(body.maxMarks ?? 0)
        const durationMin = Number(body.durationMin ?? 0)
        if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
          return fail(400, 'EXAM_INVALID', 'Total marks must be greater than zero', ['maxMarks'])
        }
        if (!Number.isFinite(durationMin) || durationMin <= 0) {
          return fail(400, 'EXAM_INVALID', 'A duration is required', ['durationMin'])
        }

        const test: Exam = {
          id: `test_${exams.length + 1}`,
          schoolId: SCHOOL_ID,
          classId,
          name,
          kind: 'TEST',
          type: 'UNIT',
          startDate: examDate,
          endDate: examDate,
          description: body.description ? String(body.description) : null,
          isPublished: false,
          publishedAt: null,
        }

        exams.push(test)
        examSubjects.push({
          id: `exs_${test.id}`,
          schoolId: SCHOOL_ID,
          examId: test.id,
          subjectId,
          examDate,
          maxMarks,
          passMarks: Math.round(maxMarks * 0.4),
          durationMin,
        })

        return created(testListItems().find((row) => row.id === test.id))
      }

      const startDate = String(body.startDate ?? '')
      const endDate = String(body.endDate ?? '')
      const rows = Array.isArray(body.subjects) ? (body.subjects as Array<Record<string, unknown>>) : []

      if (!startDate || !endDate) {
        return fail(400, 'EXAM_INVALID', 'Start and end dates are required', ['startDate', 'endDate'])
      }
      if (endDate < startDate) {
        return fail(400, 'EXAM_INVALID', 'The end date must not precede the start', ['endDate'])
      }
      if (rows.length === 0) return fail(400, 'EXAM_INVALID', 'Select at least one subject', ['subjects'])

      // Every paper is validated before any of them is written.
      for (const row of rows) {
        if (!subjects.some((item) => item.id === String(row.subjectId) && item.classId === classId)) {
          return fail(400, 'EXAM_INVALID', 'A chosen subject is not taught in that class', ['subjects'])
        }
        if (!String(row.examDate ?? '')) return fail(400, 'EXAM_INVALID', 'Every subject needs a date', ['subjects'])
      }

      const exam: Exam = {
        id: `exam_new_${exams.length + 1}`,
        schoolId: SCHOOL_ID,
        classId,
        name,
        kind: 'EXAM',
        type: (body.type ? String(body.type) : 'MID') as ExamType,
        startDate,
        endDate,
        description: body.description ? String(body.description) : null,
        isPublished: false,
        publishedAt: null,
      }

      exams.push(exam)
      for (const row of rows) {
        const maxMarks = Number(row.maxMarks ?? 0)

        examSubjects.push({
          id: `exs_${exam.id}_${String(row.subjectId)}`,
          schoolId: SCHOOL_ID,
          examId: exam.id,
          subjectId: String(row.subjectId),
          examDate: String(row.examDate),
          maxMarks,
          passMarks: Math.round(maxMarks * 0.4),
          durationMin: Number(row.durationMin ?? 0),
        })
      }

      return created(examListItems().find((item) => item.id === exam.id))
    },
  },
  {
    method: 'PATCH',
    path: '/exams/:id',
    handler: ({ params, body }) => {
      const exam = exams.find((item) => item.id === params.id)
      if (!exam) return fail(404, 'EXAM_NOT_FOUND', 'Exam not found')
      if (exam.isPublished) return fail(409, 'EXAM_PUBLISHED', 'Unpublish the exam before editing it')

      if (body.name !== undefined) {
        const name = String(body.name).trim()
        if (!name) return fail(400, 'EXAM_INVALID', 'A title is required', ['name'])
        exam.name = name
      }
      if (body.description !== undefined) {
        exam.description = body.description ? String(body.description) : null
      }

      if (exam.kind === 'TEST') {
        const paper = examSubjects.find((item) => item.examId === exam.id)
        if (!paper) return fail(404, 'EXAM_NOT_FOUND', 'Test paper not found')

        if (body.subjectId !== undefined) {
          const subjectId = String(body.subjectId)
          if (!subjects.some((item) => item.id === subjectId && item.classId === exam.classId)) {
            return fail(400, 'EXAM_INVALID', 'Choose a subject taught in that class', ['subjectId'])
          }
          paper.subjectId = subjectId
        }
        if (body.examDate !== undefined) {
          const examDate = String(body.examDate)
          if (!examDate) return fail(400, 'EXAM_INVALID', 'A date is required', ['examDate'])
          paper.examDate = examDate
          exam.startDate = examDate
          exam.endDate = examDate
        }
        if (body.maxMarks !== undefined) {
          const maxMarks = Number(body.maxMarks)
          if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
            return fail(400, 'EXAM_INVALID', 'Total marks must be greater than zero', ['maxMarks'])
          }
          paper.maxMarks = maxMarks
        }
        if (body.durationMin !== undefined) paper.durationMin = Number(body.durationMin)

        return ok(testListItems().find((row) => row.id === exam.id))
      }

      if (body.type !== undefined) exam.type = String(body.type) as ExamType
      if (body.startDate !== undefined) exam.startDate = String(body.startDate)
      if (body.endDate !== undefined) exam.endDate = String(body.endDate)
      if (exam.endDate < exam.startDate) {
        return fail(400, 'EXAM_INVALID', 'The end date must not precede the start', ['endDate'])
      }

      if (Array.isArray(body.subjects)) {
        const rows = body.subjects as Array<Record<string, unknown>>
        if (rows.length === 0) return fail(400, 'EXAM_INVALID', 'Select at least one subject', ['subjects'])

        for (const row of rows) {
          if (!subjects.some((item) => item.id === String(row.subjectId) && item.classId === exam.classId)) {
            return fail(400, 'EXAM_INVALID', 'A chosen subject is not taught in that class', ['subjects'])
          }
        }

        // The form sends the set it ended with, so the papers are replaced rather than merged.
        for (let index = examSubjects.length - 1; index >= 0; index -= 1) {
          if (examSubjects[index].examId === exam.id) examSubjects.splice(index, 1)
        }
        for (const row of rows) {
          const maxMarks = Number(row.maxMarks ?? 0)

          examSubjects.push({
            id: `exs_${exam.id}_${String(row.subjectId)}`,
            schoolId: SCHOOL_ID,
            examId: exam.id,
            subjectId: String(row.subjectId),
            examDate: String(row.examDate),
            maxMarks,
            passMarks: Math.round(maxMarks * 0.4),
            durationMin: Number(row.durationMin ?? 0),
          })
        }

        // A dropped paper takes its marks with it, the way the cascade would.
        const kept = new Set(rows.map((row) => String(row.subjectId)))
        for (let index = examResults.length - 1; index >= 0; index -= 1) {
          if (examResults[index].examId === exam.id && !kept.has(examResults[index].subjectId)) {
            examResults.splice(index, 1)
          }
        }
      }

      return ok(examListItems().find((item) => item.id === exam.id))
    },
  },
  {
    method: 'DELETE',
    path: '/exams/:id',
    handler: ({ params }) => {
      const index = exams.findIndex((item) => item.id === params.id)
      if (index < 0) return fail(404, 'EXAM_NOT_FOUND', 'Exam not found')

      const examId = exams[index].id
      exams.splice(index, 1)
      // The papers, marks and report cards go with it.
      for (let at = examSubjects.length - 1; at >= 0; at -= 1) {
        if (examSubjects[at].examId === examId) examSubjects.splice(at, 1)
      }
      for (let at = examResults.length - 1; at >= 0; at -= 1) {
        if (examResults[at].examId === examId) examResults.splice(at, 1)
      }
      for (let at = reportCards.length - 1; at >= 0; at -= 1) {
        if (reportCards[at].examId === examId) reportCards.splice(at, 1)
      }

      return ok({ deleted: true })
    },
  },
  {
    method: 'GET',
    path: '/exams/:id/results',
    handler: ({ params }) => {
      const sheet = resultSheet(String(params.id))
      return sheet ? ok(sheet) : fail(404, 'EXAM_NOT_FOUND', 'Exam not found')
    },
  },
  {
    method: 'POST',
    path: '/exams/:id/marks',
    handler: ({ params, body, userId }) => {
      const exam = exams.find((item) => item.id === params.id)
      if (!exam) return fail(404, 'EXAM_NOT_FOUND', 'Exam not found')
      if (exam.isPublished) return fail(409, 'EXAM_PUBLISHED', 'Unpublish the exam before editing marks')

      const entries = Array.isArray(body.entries) ? (body.entries as Array<Record<string, unknown>>) : []

      // Validated in full first, so a bad cell cannot leave the sheet half-written.
      for (const entry of entries) {
        const paper = examSubjects.find((item) => item.examId === exam.id && item.subjectId === String(entry.subjectId))
        if (!paper) return fail(400, 'EXAM_INVALID', 'That subject is not part of this exam', ['subjectId'])

        const raw = entry.marks === null || entry.marks === undefined || entry.marks === '' ? null : Number(entry.marks)
        if (raw !== null && (!Number.isFinite(raw) || raw < 0)) {
          return fail(400, 'EXAM_INVALID', 'Marks must be zero or more', ['marks'])
        }
        if (raw !== null && raw > paper.maxMarks) {
          return fail(400, 'EXAM_INVALID', `Marks cannot exceed ${paper.maxMarks} for this paper`, ['marks'])
        }
      }

      for (const entry of entries) {
        const studentId = String(entry.studentId ?? '')
        const subjectId = String(entry.subjectId ?? '')
        const raw = entry.marks === null || entry.marks === undefined || entry.marks === '' ? null : Number(entry.marks)
        const remarks = entry.remarks ? String(entry.remarks) : null
        const existing = examResults.find(
          (item) => item.examId === exam.id && item.studentId === studentId && item.subjectId === subjectId,
        )

        if (existing) {
          existing.obtainedMarks = raw ?? 0
          existing.remarks = remarks
          existing.isAbsent = raw === null
          existing.enteredById = userId
        } else {
          examResults.push({
            id: `res_${exam.id}_${studentId}_${subjectId}`,
            schoolId: SCHOOL_ID,
            examId: exam.id,
            studentId,
            subjectId,
            obtainedMarks: raw ?? 0,
            isAbsent: raw === null,
            remarks,
            enteredById: userId,
          })
        }
      }

      const sheet = resultSheet(exam.id)
      return sheet ? ok(sheet) : fail(404, 'EXAM_NOT_FOUND', 'Exam not found')
    },
  },
  {
    method: 'POST',
    path: '/exams/:id/publish',
    handler: ({ params }) => {
      const exam = exams.find((item) => item.id === params.id)
      if (!exam) return fail(404, 'EXAM_NOT_FOUND', 'Exam not found')

      // One transaction in the contract: flag → report cards → notifications.
      exam.isPublished = true
      exam.publishedAt = new Date().toISOString()
      rebuildReportCards(exam.id)

      const sheet = resultSheet(exam.id)
      return sheet ? ok(sheet) : fail(404, 'EXAM_NOT_FOUND', 'Exam not found')
    },
  },
  {
    method: 'POST',
    path: '/exams/:id/unpublish',
    handler: ({ params }) => {
      const exam = exams.find((item) => item.id === params.id)
      if (!exam) return fail(404, 'EXAM_NOT_FOUND', 'Exam not found')

      exam.isPublished = false
      exam.publishedAt = null
      // Withdrawing the report cards is the rollback (admin-only in the contract).
      rebuildReportCards(exam.id)

      const sheet = resultSheet(exam.id)
      return sheet ? ok(sheet) : fail(404, 'EXAM_NOT_FOUND', 'Exam not found')
    },
  },
  {
    method: 'GET',
    path: '/timetables/me',
    handler: ({ params, userId }) => {
      const requested = params.studentId ? String(params.studentId) : ''
      const mine = myTimetableOf(userId, requested)

      if (mine) return ok<MyTimetable>(mine)
      return requested
        ? fail(403, 'TIMETABLE_FORBIDDEN', 'That student is not on your account')
        : fail(404, 'TIMETABLE_NOT_FOUND', 'No timetable for this account')
    },
  },
  {
    method: 'GET',
    path: '/ai/conversations',
    handler: ({ params, userId }) => {
      const feature = params.feature ? String(params.feature) : ''

      // The caller's own history, newest first (`PRD.md` §4.12).
      const mine = aiConversations
        .filter((row) => row.userId === userId)
        .filter((row) => (feature ? row.feature === feature : true))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

      return ok<AiGeneration[]>(
        mine.flatMap((row) => {
          const generation = generationOf(row)
          return generation ? [generation] : []
        }),
      )
    },
  },
]

/** Every route except the auth handshake needs a bearer token, exactly like the real API. */
const PUBLIC_PATHS = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  // An invite is confirmed before the account can sign in, so this one needs no token (`PRD.md` §4.2).
  '/auth/verify-invite',
  '/schools/register',
  '/schools/verify-otp',
  '/schools/resend-otp',
])

/**
 * Matches a concrete path against the route table, filling `:param` segments — the same way NestJS
 * routes `/students/:id`. Returns the captured values so handlers read them off `params`.
 */
function matchRoute(method: HttpMethod, path: string): { route: Route; pathParams: Record<string, string> } | null {
  const segments = path.split('/')

  for (const route of routes) {
    if (route.method !== method) continue

    const routeSegments = route.path.split('/')
    if (routeSegments.length !== segments.length) continue

    const pathParams: Record<string, string> = {}
    const matched = routeSegments.every((segment, index) => {
      if (segment.startsWith(':')) {
        pathParams[segment.slice(1)] = decodeURIComponent(segments[index])
        return true
      }

      return segment === segments[index]
    })

    if (matched) return { route, pathParams }
  }

  return null
}

function buildResponse(config: InternalAxiosRequestConfig, status: number, body: unknown): AxiosResponse {
  return {
    data: body,
    status,
    statusText: status < 400 ? 'OK' : 'Error',
    headers: {},
    config,
  }
}

function buildError(config: InternalAxiosRequestConfig, result: MockResult): AxiosError {
  const response = buildResponse(config, result.status, result.body)
  const message = (result.body as { error?: { message?: string } })?.error?.message ?? 'Request failed'
  return new AxiosError(message, `E${result.status}`, config, null, response)
}

export function createMockAdapter(): AxiosAdapter {
  return async (config) => {
    const method = (config.method ?? 'get').toUpperCase() as HttpMethod
    const path = normalizePath(config)
    const token = readToken(config)
    const params = (config.params ?? {}) as Record<string, unknown>

    await delayFor(path)

    const route = matchRoute(method, path)
    if (!route) {
      throw buildError(config, fail(404, 'NOT_FOUND', `No mock route for ${method} ${path}`))
    }

    const userId = userIdFromToken(token)
    if (!PUBLIC_PATHS.has(path) && !userId) {
      throw buildError(config, fail(401, 'AUTH_UNAUTHENTICATED', 'Missing or invalid access token'))
    }

    const result = route.route.handler({
      method,
      path,
      body: parseBody(config),
      // Path params win over query params of the same name.
      params: { ...params, ...route.pathParams },
      userId,
    })
    if (result.status >= 400) throw buildError(config, result)

    return buildResponse(config, result.status, result.body)
  }
}

/** Exposed for the demo credentials card. */
export const mockConfig = { otpCode: OTP_CODE, refreshKey: REFRESH_KEY }
