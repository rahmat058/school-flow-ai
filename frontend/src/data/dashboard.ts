import { BarChart3, CalendarCheck, TrendingUp, Wallet } from 'lucide-react'
import type { ChartPoint, DashboardSummary, RecentPayment, StatMetric } from '@/types/dashboard'
import { dateTimeOffset } from '@/data/seed'
import { students } from '@/data/students'
import { attendance, registerDays } from '@/data/attendance'
import { feeInvoices, feePayments } from '@/data/fees'
import { dashboardInsight } from '@/data/ai'
import { formatPaise } from '@/lib/format'
import { initialsOf } from '@/lib/format'
import { findStudent } from '@/data/students'

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** Attendance on the most recent register day. */
function latestAttendancePercentage(): number {
  const latest = registerDays[0]
  const records = attendance.filter((record) => record.attendanceDate === latest)
  if (records.length === 0) return 0
  const present = records.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length
  return Number(((present / records.length) * 100).toFixed(1))
}

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

const recentPayments: RecentPayment[] = [...feePayments]
  .sort((left, right) => (right.paidAt ?? '').localeCompare(left.paidAt ?? ''))
  .slice(0, 5)
  .map((payment) => {
    const student = findStudent(payment.studentId)
    const name = student ? `${student.firstName} ${student.lastName}` : 'Unknown student'

    return {
      id: payment.id,
      studentName: name,
      initials: initialsOf(name),
      amountPaise: payment.amountPaise,
      status: 'PAID',
      method: payment.method,
      paidAt: payment.paidAt ?? dateTimeOffset(0),
    }
  })

export const dashboardSummary: DashboardSummary = {
  stats,
  collectionTrend,
  quarterlyTrend,
  highlightedMonth: MONTH_LABELS[new Date().getMonth()],
  recentPayments,
  insight: dashboardInsight,
}
