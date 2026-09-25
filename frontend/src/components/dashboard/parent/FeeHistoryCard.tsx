import { formatDate, formatPaise } from '@/lib/format'
import { StatusBadge } from '@/components/ui/Badge'
import type { StudentInvoice } from '@/types/dashboard'

interface FeeHistoryCardProps {
  fees: StudentInvoice[]
}

/** Every invoice raised against the child, newest due date first, with what is still owed. */
export function FeeHistoryCard({ fees }: FeeHistoryCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Fee history</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Invoices raised against your child</p>
      </div>

      {fees.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">No invoices have been raised yet.</p>
      ) : (
        <ul className="divide-line divide-y">
          {fees.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13px] font-medium">{row.title}</p>
                <p className="text-ink-muted mt-0.5 truncate text-[12px]">
                  Due {formatDate(row.dueDate, 'dd MMM yyyy')}
                  {row.receiptNo ? ` · ${row.receiptNo}` : ''}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-ink text-[13px] font-semibold tabular-nums">{formatPaise(row.amountPaise)}</p>
                {row.status === 'PARTIAL' ? (
                  <p className="text-ink-subtle mt-0.5 text-[12px] tabular-nums">{formatPaise(row.paidPaise)} paid</p>
                ) : null}
              </div>

              <StatusBadge status={row.status} />
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
