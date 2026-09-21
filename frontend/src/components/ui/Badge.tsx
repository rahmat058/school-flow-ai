import { cn } from '@/lib/cn'
import type { TransactionStatus } from '@/types/dashboard'

interface StatusBadgeProps {
  status: TransactionStatus
}

const statusStyles: Record<TransactionStatus, string> = {
  completed: 'bg-success-soft text-success',
  pending: 'bg-[#f3efe6] text-[#8a7a5e]',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.04em] uppercase',
        statusStyles[status],
      )}>
      {status}
    </span>
  )
}
