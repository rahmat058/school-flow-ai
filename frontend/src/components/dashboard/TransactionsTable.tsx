import { StatusBadge } from '@/components/ui/Badge'
import { transactions } from '@/data/dashboard'

export function TransactionsTable() {
  return (
    <article className="border-line bg-surface overflow-hidden rounded-xl border shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div>
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Recent Transactions</h2>
          <p className="text-ink-muted mt-1 text-[13px]">Last 5 business transactions across all plans</p>
        </div>
        <button
          type="button"
          className="text-primary hover:text-primary-hover text-[14px] font-medium transition-colors">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-line text-ink-subtle border-y text-[12px] font-medium tracking-[0.04em] uppercase">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Plan</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className="border-line hover:bg-canvas border-b transition-colors last:border-b-0">
                <td className="text-ink-muted px-6 py-4 text-[14px]">{txn.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-canvas text-ink-muted inline-flex size-8 items-center justify-center rounded-full text-[11px] font-medium">
                      {txn.initials}
                    </span>
                    <span className="text-ink text-[14px] font-medium">{txn.customer}</span>
                  </div>
                </td>
                <td className="text-ink px-6 py-4 text-[14px] font-medium">{txn.amount}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={txn.status} />
                </td>
                <td className="text-ink-muted px-6 py-4 text-[14px]">{txn.plan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
