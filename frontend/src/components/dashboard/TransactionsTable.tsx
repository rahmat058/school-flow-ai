import { StatusBadge } from '@/components/ui/Badge'
import { transactions } from '@/data/dashboard'

export function TransactionsTable() {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em] text-ink">
            Recent Transactions
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Last 5 business transactions across all plans
          </p>
        </div>
        <button
          type="button"
          className="text-[14px] font-medium text-primary transition-colors hover:text-primary-hover"
        >
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-y border-line text-[12px] font-medium tracking-[0.04em] text-ink-subtle uppercase">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Plan</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className="border-b border-line last:border-b-0 transition-colors hover:bg-canvas"
              >
                <td className="px-6 py-4 text-[14px] text-ink-muted">
                  {txn.date}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-canvas text-[11px] font-medium text-ink-muted">
                      {txn.initials}
                    </span>
                    <span className="text-[14px] font-medium text-ink">
                      {txn.customer}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[14px] font-medium text-ink">
                  {txn.amount}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={txn.status} />
                </td>
                <td className="px-6 py-4 text-[14px] text-ink-muted">
                  {txn.plan}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
