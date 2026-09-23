import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types/auth'
import type { InvoiceStatus } from '@/types/fees'

export type TrendDirection = 'up' | 'down'
export type IconTone = 'primary' | 'success' | 'error' | 'warning'

export interface StatMetric {
  id: string
  label: string
  value: string
  delta: string
  direction: TrendDirection
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
