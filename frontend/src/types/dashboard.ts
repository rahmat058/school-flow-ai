import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types/auth'
import type { AttendanceStatus } from '@/types/attendance'
import type { NoticePriority } from '@/types/communication'
import type { StudentResultRow } from '@/types/exams'
import type { InvoiceStatus } from '@/types/fees'

export type TrendDirection = 'up' | 'down'
export type IconTone = 'primary' | 'success' | 'error' | 'warning'

export interface StatMetric {
  id: string
  label: string
  value: string
  /** The line under the value: a trend when `direction` is set, otherwise a plain caption. */
  delta: string
  /** Omitted when the number has no better-or-worse reading — the caption then stays neutral. */
  direction?: TrendDirection
  icon: LucideIcon
  iconTone: IconTone
}

export interface ChartPoint {
  label: string
  value: number
}

/** Nav is configuration, not server data — see `src/lib/navigation.ts`. */
export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: Role[]
}

export interface DashboardSummary {
  stats: StatMetric[]
  collectionTrend: ChartPoint[]
  quarterlyTrend: ChartPoint[]
  /** Attendance share per register day, oldest first. `value` is a percentage, not money. */
  attendanceTrend: ChartPoint[]
  /** Class average across published results. `value` is a percentage, not money. */
  classPerformance: ChartPoint[]
  highlightedMonth: string
  /** Newest-first events merged from payments, submissions and notices. */
  recentActivity: ActivityItem[]
  /** Subject papers dated today or later, soonest first. */
  upcomingExams: UpcomingExam[]
  /** Invoices with an outstanding balance, most overdue first. */
  pendingFees: PendingFee[]
  /** Dated entries for the month grid — school events and exam days. */
  calendarEntries: CalendarEntry[]
}

export interface UpcomingExam {
  id: string
  /** Exam and subject, e.g. "Unit Test 2 — English". */
  title: string
  className: string
  date: string
  /** Whole days from today; never negative for an upcoming paper. */
  daysAway: number
}

export interface PendingFee {
  id: string
  studentName: string
  initials: string
  className: string
  /** Outstanding balance in paise — amount less discount and payments made. */
  pendingPaise: number
  dueDate: string
  status: InvoiceStatus
}

export interface CalendarEntry {
  id: string
  date: string
  title: string
  kind: 'EVENT' | 'EXAM'
}

export interface ActivityItem {
  id: string
  /** What happened, e.g. "Fee paid". */
  title: string
  /** Who or what it concerns. */
  detail: string
  timestamp: string
  icon: LucideIcon
  tone: IconTone
}

/** One teaching period of the student's day — breaks are left out by the read model. */
export interface StudentTimetableSlot {
  orderIndex: number
  /** Already resolved for display: a named row, else `Period n` over teaching rows only. */
  label: string
  subjectName: string | null
  teacherName: string | null
  /** `HH:mm` 24-hour, as Postgres `time`. */
  startTime: string
  endTime: string
}

/** Today's schedule for the student's own class. */
export interface StudentDay {
  /** ISO date (`YYYY-MM-DD`). */
  date: string
  /** e.g. "Friday". */
  dayLabel: string
  className: string
  slots: StudentTimetableSlot[]
}

/** A published notice the student is in the audience of. */
export interface StudentNotice {
  id: string
  title: string
  authorName: string
  publishedAt: string
  priority: NoticePriority
}

/** One invoice raised against the student — what the My Fees list renders. */
export interface StudentInvoice {
  id: string
  title: string
  receiptNo: string | null
  amountPaise: number
  paidPaise: number
  /** ISO date (`YYYY-MM-DD`). */
  dueDate: string
  status: InvoiceStatus
}

export interface StudentFeeBreakdown {
  paidPaise: number
  /** Billed net of concession, so `paid + pending = total` holds. */
  pendingPaise: number
  totalPaise: number
  /** Paid share of the total, 0–100. */
  progress: number
  /** Oldest due date first. */
  rows: StudentInvoice[]
}

/** One register day, newest first. */
export interface StudentAttendanceDay {
  date: string
  className: string
  status: AttendanceStatus
}

export interface StudentAttendanceOverview {
  present: number
  absent: number
  late: number
  total: number
  /** Present-and-late share, 0–100 — the same rule the roster and reports use. */
  rate: number
  /** The last few register days, newest first. */
  recent: StudentAttendanceDay[]
}

/**
 * `GET /dashboard/student` — the caller's own day in one payload. Every figure is a roll-up of rows
 * that exist (register, invoices, class timetable), computed server-side rather than in the view.
 */
export interface StudentDashboard {
  /** Attendance, total fees, fee pending and upcoming exams. */
  stats: StatMetric[]
  /** `null` when today is not a school day. */
  today: StudentDay | null
  upcomingExams: UpcomingExam[]
  notices: StudentNotice[]
  fees: StudentFeeBreakdown
  attendance: StudentAttendanceOverview
}

/** One of a guardian's children — the parent dashboard's switcher and its header chip. */
export interface ParentChild {
  id: string
  name: string
  /** Display label, e.g. `1-A`. */
  className: string
  rollNo: number
}

/** An assignment on the child's class that they have not submitted yet. */
export interface ParentHomeworkRow {
  id: string
  subjectName: string
  title: string
  /** ISO date (`YYYY-MM-DD`) — the late-submission boundary. */
  dueDate: string
  /** Whole days from today; negative once the due date has passed. */
  daysAway: number
}

/** A published notice a guardian is in the audience of, with the body its list line shows. */
export interface ParentNotice {
  id: string
  title: string
  body: string
  publishedAt: string
  priority: NoticePriority
}

/**
 * `GET /dashboard/parent?studentId=` — a guardian's view of **one** child in one payload. The child
 * comes from the session's own children, so `studentId` may only name one of them; omitted, the
 * first is used. Every figure reuses the read model the child's own screens already show — the
 * register totals, the invoices, the published marks, the class's assignments — so a parent and
 * their child cannot be shown different numbers.
 */
export interface ParentDashboard {
  /** The guardian's children, so the screen can switch between them. */
  children: ParentChild[]
  child: ParentChild | null
  /** Attendance, pending fees, average score and homework due. */
  stats: StatMetric[]
  /** One point per published result, oldest first — the child's scores over time. */
  progress: ChartPoint[]
  /** The child's published marks, newest first. */
  results: StudentResultRow[]
  /** Class assignments the child has not submitted. */
  homework: ParentHomeworkRow[]
  /** Every invoice raised against the child, newest due date first. */
  fees: StudentInvoice[]
  /** The class's papers still ahead, soonest first. */
  exams: UpcomingExam[]
  /** Published notices for a guardian, newest first. */
  notices: ParentNotice[]
}
