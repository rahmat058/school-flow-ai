import { cn } from '@/lib/cn'
import { humanizeEnum } from '@/lib/format'
import type { NoticePriority } from '@/types/communication'
import type { AttendanceStatus } from '@/types/attendance'
import type { ExamStatus } from '@/types/exams'
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
