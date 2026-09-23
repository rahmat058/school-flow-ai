import { cn } from '@/lib/cn'
import { formatDate, formatPaise } from '@/lib/format'
import { Avatar } from '@/components/ui/Avatar'
import type { PendingFee } from '@/types/dashboard'

const STATUS_LABELS: Record<PendingFee['status'], string> = {
  PENDING: 'Pending',
  PARTIAL: 'Part paid',
  OVERDUE: 'Overdue',
  PAID: 'Paid',
}

interface PendingFeesCardProps {
  fees: PendingFee[]
}

/** Invoices with a balance left, most urgent first. Overdue reads in the error tint, the rest warn. */
export function PendingFeesCard({ fees }: PendingFeesCardProps) {
  const visible = fees.slice(0, 5)
  const outstandingPaise = fees.reduce((total, fee) => total + fee.pendingPaise, 0)

  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Pending fees</h2>
          <p className="text-ink-muted mt-1 text-[13px]">{formatPaise(outstandingPaise)} outstanding</p>
        </div>

        {fees.length > 0 ? (
          <span className="bg-error-soft text-error shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium">
            {fees.length} pending
          </span>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">Every invoice is settled.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((fee) => (
            <li key={fee.id} className="flex items-start gap-3">
              <Avatar name={fee.studentName} size="sm" />

              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13px] font-medium">{fee.studentName}</p>
                <p className="text-ink-muted mt-0.5 truncate text-[12px]">
                  {fee.className ? `${fee.className} · ` : ''}
                  {STATUS_LABELS[fee.status]} · due {formatDate(fee.dueDate, 'dd MMM')}
                </p>
              </div>

              <p
                className={cn(
                  'shrink-0 text-[13px] font-semibold',
                  fee.status === 'OVERDUE' ? 'text-error' : 'text-warning',
                )}>
                {formatPaise(fee.pendingPaise)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {fees.length > visible.length ? (
        <p className="text-ink-subtle mt-5 text-[12px]">
          Showing the {visible.length} most urgent of {fees.length}.
        </p>
      ) : null}
    </article>
  )
}
