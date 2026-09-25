import { cn } from '@/lib/cn'
import { formatDate, formatPaise } from '@/lib/format'
import { StatusBadge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import type { StudentFeeBreakdown } from '@/types/dashboard'

interface StudentFeesCardProps {
  fees: StudentFeeBreakdown
}

/** What the student owes, how far they have got, and every invoice behind the two numbers. */
export function StudentFeesCard({ fees }: StudentFeesCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">My fees</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Invoices raised against your account</p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <div className="bg-canvas rounded-lg p-3">
          <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Paid</dt>
          <dd className="font-display text-success mt-1 text-[18px] font-semibold tracking-[-0.02em]">
            {formatPaise(fees.paidPaise)}
          </dd>
        </div>
        <div className="bg-canvas rounded-lg p-3">
          <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Pending</dt>
          <dd
            className={cn(
              'font-display mt-1 text-[18px] font-semibold tracking-[-0.02em]',
              fees.pendingPaise > 0 ? 'text-error' : 'text-ink',
            )}>
            {formatPaise(fees.pendingPaise)}
          </dd>
        </div>
        <div className="bg-canvas rounded-lg p-3">
          <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Total</dt>
          <dd className="font-display text-ink mt-1 text-[18px] font-semibold tracking-[-0.02em]">
            {formatPaise(fees.totalPaise)}
          </dd>
        </div>
      </dl>

      <Progress
        className="mt-5"
        label="Payment progress"
        showValue
        value={fees.progress}
        tone={fees.pendingPaise > 0 ? 'warning' : 'success'}
      />

      {fees.rows.length === 0 ? (
        <p className="text-ink-subtle mt-5 text-[13px]">No invoices have been raised yet.</p>
      ) : (
        <ul className="divide-line mt-5 divide-y">
          {fees.rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 py-3">
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
