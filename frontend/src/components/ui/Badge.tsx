import { cn } from '@/lib/cn'
import { humanizeEnum } from '@/lib/format'
import { EXAM_TYPE_LABELS } from '@/lib/options'
import type { NoticePriority } from '@/types/communication'
import type { AttendanceStatus } from '@/types/attendance'
import type { ExamStatus, ExamType } from '@/types/exams'
import type { RecordStatus, FeeStanding } from '@/types/people'
import type { InvoiceStatus, PaymentStatus } from '@/types/fees'

type BadgeStatus =
  | InvoiceStatus
  | PaymentStatus
  | RecordStatus
  | FeeStanding
  | NoticePriority
  | ExamStatus
  | 'PASS'
  | 'FAIL'
  | 'ABSENT'
  | 'PUBLISHED'
  | 'DRAFT'
  | 'CLEAR'

const statusStyles: Record<BadgeStatus, string> = {
  PAID: 'bg-success-soft text-success',
  PENDING: 'bg-warning-soft text-warning',
  UNPAID: 'bg-warning-soft text-warning',
  PARTIAL: 'bg-primary-soft text-primary',
  OVERDUE: 'bg-error-soft text-error',
  FAILED: 'bg-error-soft text-error',
  REFUNDED: 'bg-canvas text-ink-muted',
  ACTIVE: 'bg-success-soft text-success',
  INACTIVE: 'bg-canvas text-ink-muted',
  CLEAR: 'bg-success-soft text-success',
  HIGH: 'bg-error-soft text-error',
  MEDIUM: 'bg-warning-soft text-warning',
  LOW: 'bg-canvas text-ink-muted',
  UPCOMING: 'bg-warning-soft text-warning',
  COMPLETED: 'bg-success-soft text-success',
  PASS: 'bg-success-soft text-success',
  FAIL: 'bg-error-soft text-error',
  ABSENT: 'bg-canvas text-ink-muted',
  PUBLISHED: 'bg-success-soft text-success',
  DRAFT: 'bg-canvas text-ink-muted',
}

interface StatusBadgeProps {
  status: BadgeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.04em] uppercase',
        statusStyles[status],
      )}>
      {humanizeEnum(status)}
    </span>
  )
}

/**
 * Attendance has its own vocabulary — present, late, leave, absent — and its `ABSENT` wants the error
 * tint, where the shared `StatusBadge`'s `ABSENT` deliberately reads neutral for a missing mark in the
 * reports. Kept beside `StatusBadge` so every status pill maps in one place.
 */
const attendanceStyles: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-success-soft text-success',
  LATE: 'bg-orange-soft text-warning',
  LEAVE: 'bg-primary-soft text-primary',
  ABSENT: 'bg-error-soft text-error',
}

interface AttendanceBadgeProps {
  status: AttendanceStatus
}

export function AttendanceBadge({ status }: AttendanceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.04em] uppercase',
        attendanceStyles[status],
      )}>
      {humanizeEnum(status)}
    </span>
  )
}

/**
 * An exam's type — a category, not a state, so it carries one informational tint rather than a
 * semantic one: a `FINAL` is not an error and a `UNIT` test is not a warning. Shared so the three
 * grids that render it (both staff exam tables and the student's cards and results) agree.
 */
interface ExamTypeBadgeProps {
  type: ExamType
}

export function ExamTypeBadge({ type }: ExamTypeBadgeProps) {
  return (
    <span className="bg-primary-soft text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap">
      {EXAM_TYPE_LABELS[type]}
    </span>
  )
}

export type CountTone = 'primary' | 'success' | 'warning' | 'error'

const countTones: Record<CountTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

/**
 * A count bubble — the unread badge on the header bell, and the record size beside a tab label.
 * Solid fills with white text, because at 10px the `-soft` tints vanish into the surface. Both
 * places render this one component so "like the bell's badge" stays true by construction; a caller
 * that needs to place it over something (the bell overlays its icon) passes `className`.
 */
interface CountBadgeProps {
  value: number | string
  tone?: CountTone
  className?: string
}

export function CountBadge({ value, tone = 'primary', className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-4 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums',
        countTones[tone],
        className,
      )}>
      {value}
    </span>
  )
}
