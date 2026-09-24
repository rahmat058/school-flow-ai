import { BarChart3, BookOpen, CalendarCheck, Megaphone, TrendingUp, Wallet } from 'lucide-react'
import type {
  ActivityItem,
  CalendarEntry,
  ChartPoint,
  DashboardSummary,
  PendingFee,
  StatMetric,
  UpcomingExam,
} from '@/types/dashboard'
import { dateOffset, dateTimeOffset } from '@/data/seed'
import { students } from '@/data/students'
import { attendance, registerDays } from '@/data/attendance'
import { classLabel, classes } from '@/data/classes'
import { examResults, examSubjects, exams, maxMarks } from '@/data/exams'
import { homework, homeworkSubmissions } from '@/data/homework'
import { events, notices } from '@/data/notices'
import { feeInvoices, feePayments } from '@/data/fees'
import { findSubject } from '@/data/subjects'
import { formatPaise, initialsOf } from '@/lib/format'
import { findStudent } from '@/data/students'

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** Present-and-late share of one register day. */
function attendancePercentage(day: string): number {
  const records = attendance.filter((record) => record.attendanceDate === day)
  if (records.length === 0) return 0

  const present = records.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length
  return Number(((present / records.length) * 100).toFixed(1))
}

/** Attendance on the most recent register day. */
function latestAttendancePercentage(): number {
  return attendancePercentage(registerDays[0])
}

/**
 * Attendance per register day, oldest first. `registerDays` is newest-first, so take the last seven
 * days on record and reverse them for a left-to-right timeline.
 */
const attendanceTrend: ChartPoint[] = [...registerDays]
  .slice(0, 7)
  .reverse()
  .map((day) => ({
    label: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    value: attendancePercentage(day),
  }))

const collectedPaise = feeInvoices.reduce((total, invoice) => total + invoice.paidPaise, 0)
const pendingPaise = feeInvoices.reduce(
  (total, invoice) => total + Math.max(invoice.amountPaise - invoice.discountPaise - invoice.paidPaise, 0),
  0,
)
const overdueCount = feeInvoices.filter((invoice) => invoice.status === 'OVERDUE').length

const stats: StatMetric[] = [
  {
    id: 'students',
    label: 'Students enrolled',
    value: students.length.toString(),
    delta: '+2 this term',
    direction: 'up',
    icon: BarChart3,
    iconTone: 'primary',
  },
  {
    id: 'attendance',
    label: 'Attendance today',
    value: `${latestAttendancePercentage()}%`,
    delta: '+1.2%',
    direction: 'up',
    icon: CalendarCheck,
    iconTone: 'success',
  },
  {
    id: 'collected',
    label: 'Fees collected',
    value: formatPaise(collectedPaise),
    delta: '+12.4%',
    direction: 'up',
    icon: Wallet,
    iconTone: 'primary',
  },
  {
    id: 'pending',
    label: 'Fees pending',
    value: formatPaise(pendingPaise),
    delta: `${overdueCount} overdue`,
    direction: 'down',
    icon: TrendingUp,
    iconTone: 'error',
  },
]

/** Twelve months of collection, closing on the current month. */
const collectionTrend: ChartPoint[] = (() => {
  const month = new Date().getMonth()
  const base = 1_180_000

  return Array.from({ length: 12 }, (_, offset) => {
    const label = MONTH_LABELS[(month - 11 + offset + 24) % 12]
    return { label, value: base + ((offset * 97_000) % 520_000) }
  })
})()

const quarterlyTrend: ChartPoint[] = [
  { label: 'Q1', value: 3_540_000 },
  { label: 'Q2', value: 4_020_000 },
  { label: 'Q3', value: 4_610_000 },
  { label: 'Q4', value: 4_350_000 },
]

/** Average marks per class, as a percentage so the chart keeps a fixed 0–100 axis. */
const classPerformance: ChartPoint[] = classes.map((classRoom) => {
  const classStudentIds = new Set(
    students.filter((student) => student.classId === classRoom.id).map((student) => student.id),
  )
  const marks = examResults.filter((result) => classStudentIds.has(result.studentId))
  const average =
    marks.length === 0 ? 0 : marks.reduce((total, result) => total + result.obtainedMarks, 0) / marks.length

  return {
    label: classLabel(classRoom),
    value: Number(((average / maxMarks) * 100).toFixed(1)),
  }
})

const feeActivity: ActivityItem[] = feePayments.map((payment) => {
  const student = findStudent(payment.studentId)
  const name = student ? `${student.firstName} ${student.lastName}` : 'A student'

  return {
    id: `act_${payment.id}`,
    title: 'Fee paid',
    detail: `${name} · ${formatPaise(payment.amountPaise)}`,
    timestamp: payment.paidAt ?? dateTimeOffset(0),
    icon: Wallet,
    tone: 'success',
  }
})

const homeworkActivity: ActivityItem[] = homeworkSubmissions.map((submission) => {
  const student = findStudent(submission.studentId)
  const assignment = homework.find((item) => item.id === submission.homeworkId)
  const name = student ? `${student.firstName} ${student.lastName}` : 'A student'

  return {
    id: `act_${submission.id}`,
    title: submission.isLate ? 'Homework submitted late' : 'Homework submitted',
    detail: `${name} · ${assignment?.title ?? 'Assignment'}`,
    timestamp: submission.submittedAt,
    icon: BookOpen,
    tone: submission.isLate ? 'warning' : 'primary',
  }
})

const publishedNotices = notices.filter((notice) => notice.publishedAt !== null)
const noticeActivity: ActivityItem[] = publishedNotices.map((notice) => ({
  id: `act_${notice.id}`,
  title: 'Notice published',
  detail: notice.title,
  timestamp: notice.publishedAt ?? '',
  icon: Megaphone,
  tone: 'primary',
}))

/**
 * Newest-first feed, merged from records that exist — a payment, a submission, a published notice.
 * It is not an audit log: there is no table behind it, so nothing here is invented.
 */
const recentActivity: ActivityItem[] = [...feeActivity, ...homeworkActivity, ...noticeActivity]
  .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
  .slice(0, 5)

const TODAY = dateOffset(0)

function daysUntil(date: string): number {
  return Math.round((Date.parse(date) - Date.parse(TODAY)) / 86_400_000)
}

function paperTitle(examId: string, subjectId: string): string {
  const exam = exams.find((item) => item.id === examId)

  return `${exam?.name ?? 'Exam'} — ${findSubject(subjectId)?.name ?? 'Subject'}`
}

/** Subject papers still ahead, soonest first. */
const upcomingExams: UpcomingExam[] = examSubjects
  .filter((paper) => paper.examDate >= TODAY)
  .sort((left, right) => left.examDate.localeCompare(right.examDate))
  .slice(0, 5)
  .map((paper) => {
    const exam = exams.find((item) => item.id === paper.examId)
    const classRoom = classes.find((item) => item.id === exam?.classId)

    return {
      id: paper.id,
      title: paperTitle(paper.examId, paper.subjectId),
      className: classRoom ? classLabel(classRoom) : '',
      date: paper.examDate,
      daysAway: daysUntil(paper.examDate),
    }
  })

/** Every invoice with something still owed on it, most urgent first. */
const pendingFees: PendingFee[] = feeInvoices
  .map((invoice) => ({
    invoice,
    pendingPaise: Math.max(invoice.amountPaise - invoice.discountPaise - invoice.paidPaise, 0),
  }))
  .filter((entry) => entry.pendingPaise > 0)
  .sort((left, right) => left.invoice.dueDate.localeCompare(right.invoice.dueDate))
  .map(({ invoice, pendingPaise }) => {
    const student = findStudent(invoice.studentId)
    const classRoom = classes.find((item) => item.id === student?.classId)
    const name = student ? `${student.firstName} ${student.lastName}` : 'A student'

    return {
      id: invoice.id,
      studentName: name,
      initials: initialsOf(name),
      className: classRoom ? classLabel(classRoom) : '',
      pendingPaise,
      dueDate: invoice.dueDate,
      status: invoice.status,
    }
  })

/** Dated entries for the month grid — school events plus the papers still to be sat, soonest first. */
const calendarEntries: CalendarEntry[] = [
  ...events.map((event) => ({ id: event.id, date: event.eventDate, title: event.title, kind: 'EVENT' as const })),
  ...examSubjects
    .filter((paper) => paper.examDate >= TODAY)
    .map((paper) => ({
      id: paper.id,
      date: paper.examDate,
      title: paperTitle(paper.examId, paper.subjectId),
      kind: 'EXAM' as const,
    })),
].sort((left, right) => left.date.localeCompare(right.date))

export const dashboardSummary: DashboardSummary = {
  stats,
  collectionTrend,
  quarterlyTrend,
  attendanceTrend,
  classPerformance,
  highlightedMonth: MONTH_LABELS[new Date().getMonth()],
  recentActivity,
  upcomingExams,
  pendingFees,
  calendarEntries,
}
