import { cn } from '@/lib/cn'
import { humanizeEnum } from '@/lib/format'
import type { RecordStatus } from '@/types/people'
import type { InvoiceStatus, PaymentStatus } from '@/types/fees'

type BadgeStatus = InvoiceStatus | PaymentStatus | RecordStatus

const statusStyles: Record<BadgeStatus, string> = {
  PAID: 'bg-success-soft text-success',
  PENDING: 'bg-warning-soft text-warning',
  PARTIAL: 'bg-primary-soft text-primary',
  OVERDUE: 'bg-error-soft text-error',
  FAILED: 'bg-error-soft text-error',
  REFUNDED: 'bg-canvas text-ink-muted',
  ACTIVE: 'bg-success-soft text-success',
  INACTIVE: 'bg-canvas text-ink-muted',
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
