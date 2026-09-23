import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatPaise, humanizeEnum } from '@/lib/format'
import type { RecentPayment } from '@/types/dashboard'

interface RecentPaymentsTableProps {
  payments: RecentPayment[]
}

/** Latest settlements — the demo stand-in for `GET /fees/payments?limit=5`. */
export function RecentPaymentsTable({ payments }: RecentPaymentsTableProps) {
  return (
    <article className="border-line bg-surface overflow-hidden rounded-xl border shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div>
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Recent payments</h2>
          <p className="text-ink-muted mt-1 text-[13px]">Last 5 fee settlements across all classes</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-line text-ink-subtle border-y text-[12px] font-medium tracking-[0.04em] uppercase">
              <th className="px-6 py-3">Paid on</th>
              <th className="px-6 py-3">Student</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-line hover:bg-primary-soft border-b transition-colors last:border-b-0">
                <td className="text-ink-muted px-6 py-4 text-[14px]">{formatDate(payment.paidAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-canvas text-ink-muted inline-flex size-8 items-center justify-center rounded-full text-[11px] font-medium">
                      {payment.initials}
                    </span>
                    <span className="text-ink text-[14px] font-medium">{payment.studentName}</span>
                  </div>
                </td>
                <td className="text-ink px-6 py-4 text-[14px] font-medium">{formatPaise(payment.amountPaise)}</td>
                <td className="text-ink-muted px-6 py-4 text-[14px]">{humanizeEnum(payment.method)}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
