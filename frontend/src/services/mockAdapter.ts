import { AxiosError } from 'axios'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type { AuthSession, AuthUser, OtpChallenge } from '@/types/auth'
import type { ClassOption } from '@/types/academic'
import type { FeeCollectionSummary, FeeInvoice, FeeInvoiceListItem, InvoiceStatus } from '@/types/fees'
import type { Notice } from '@/types/communication'
import type {
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
  Gender,
} from '@/types/people'
import { SCHOOL_DOMAIN, SCHOOL_ID, dateOffset, schoolEmail } from '@/data/seed'
import { activeSchool } from '@/data/school'
import { classLabel, classes } from '@/data/classes'
import { findTeacher, teachers } from '@/data/teachers'
import { examResults, examSubjects, exams, gradeForPercentage, maxMarks } from '@/data/exams'
import { findSubject } from '@/data/subjects'
import { feeInvoices, feePayments, feeStructures } from '@/data/fees'
import { formatDate } from '@/lib/format'
import { students } from '@/data/students'
import { attendance } from '@/data/attendance'
import { parents, parentStudents } from '@/data/parents'
import { notices } from '@/data/notices'
import { dashboardSummary } from '@/data/dashboard'
import { demoAccounts, users } from '@/data/users'

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
    const primaryLink = parentStudents.find((link) => link.studentId === student.id && link.isPrimary)
    const guardian = primaryLink ? parents.find((parent) => parent.id === primaryLink.parentId) : undefined

    const register = attendance.filter((record) => record.studentId === student.id)
    const present = register.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length
    const invoices = feeInvoices.filter((invoice) => invoice.studentId === student.id)
    const outstanding = (invoice: FeeInvoice) =>
      Math.max(invoice.amountPaise - invoice.discountPaise - invoice.paidPaise, 0)
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
      attendancePercentage: register.length === 0 ? 0 : Math.round((present / register.length) * 100),
      feeStanding: isOverdue ? 'OVERDUE' : duePaise > 0 ? 'UNPAID' : 'PAID',
    }
  })
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
      const structure = feeStructures.find((item) => item.id === invoice.feeStructureId)

      return {
        id: invoice.id,
        // Invoices carry no title or period of their own yet — see the note in PRD §4.6.
        title: structure ? `${structure.name} · due ${formatDate(invoice.dueDate, 'dd MMM yyyy')}` : 'Fee invoice',
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

/** A roll number is unique within its class — the roster cannot show 5A twice. */
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
      isVerified: true,
      profileId: parent.id,
      firstName,
      lastName,
      classId: null,
    })
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

function invoiceListItems(): FeeInvoiceListItem[] {
  return feeInvoices.map((invoice) => {
    const student = students.find((item) => item.id === invoice.studentId)
    const classRoom = classes.find((item) => item.id === student?.classId)

    return {
      ...invoice,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown student',
      admissionNo: student?.admissionNo ?? '—',
      className: classRoom ? classLabel(classRoom) : 'Unassigned',
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

/** Passwords minted for invited logins, so a newly enrolled student can actually sign in. */
const invitedPasswords = new Map<string, string>()

function temporaryPassword(): string {
  return `sf-${Math.random().toString(36).slice(2, 8)}`
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
  { method: 'GET', path: '/schools/current', handler: () => ok(activeSchool) },
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
    handler: () => ok<Teacher[]>(teachers),
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
      if (!classes.some((classRoom) => classRoom.id === classId)) {
        return fail(400, 'STUDENT_INVALID', 'Choose a class for the student', ['classId'])
      }

      // The enrolment form requires every field, so the API does too.
      if (!body.dateOfBirth) return fail(400, 'STUDENT_INVALID', 'Date of birth is required', ['dateOfBirth'])
      if (!body.gender) return fail(400, 'STUDENT_INVALID', 'Gender is required', ['gender'])
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
        classId,
        rollNo,
        status: 'ACTIVE',
      }

      const email = schoolEmail(index, `student.${SCHOOL_DOMAIN}`)
      const password = temporaryPassword()

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

      const filtered = [...notices]
        .filter((notice) => matches(term, [notice.title, notice.body]))
        .sort((left, right) => (right.publishedAt ?? '').localeCompare(left.publishedAt ?? ''))

      const { items, meta } = paginate(filtered, params)
      return ok<Notice[]>(items, meta)
    },
  },
  {
    method: 'GET',
    path: '/fees/invoices',
    handler: ({ params }) => {
      const term = searchTerm(params)
      const status = params.status ? String(params.status) : ''

      const filtered = invoiceListItems()
        .filter((invoice) => (status ? invoice.status === status : true))
        .filter((invoice) =>
          matches(term, [invoice.studentName, invoice.admissionNo, invoice.receiptNo, invoice.className]),
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
      const open: InvoiceStatus[] = ['PENDING', 'PARTIAL', 'OVERDUE']
      const filtered = invoiceListItems()
        .filter((invoice) => open.includes(invoice.status))
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate))

      const { items, meta } = paginate(filtered, params)
      return ok(items, meta)
    },
  },
  {
    method: 'GET',
    path: '/fees/summary',
    handler: () => {
      const invoices = invoiceListItems()
      const summary: FeeCollectionSummary = {
        collectedPaise: invoices.reduce((total, invoice) => total + invoice.paidPaise, 0),
        pendingPaise: invoices.reduce(
          (total, invoice) => total + Math.max(invoice.amountPaise - invoice.discountPaise - invoice.paidPaise, 0),
          0,
        ),
        overdueCount: invoices.filter((invoice) => invoice.status === 'OVERDUE').length,
        concessionPaise: invoices.reduce((total, invoice) => total + invoice.discountPaise, 0),
      }

      return ok(summary)
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
