import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { iconToneStyles } from '@/components/dashboard/common/iconTone'
import type { ActivityItem } from '@/types/dashboard'

interface RecentActivityCardProps {
  items: ActivityItem[]
}

/**
 * The latest events across fees, homework and notices. Not an audit log — each row is derived from
 * a record that exists, so nothing here is invented for the sake of a fuller card.
 */
export function RecentActivityCard({ items }: RecentActivityCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Recent activity</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Payments, submissions and notices</p>
      </div>

      {items.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">Nothing has happened yet.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
                    iconToneStyles[item.tone],
                  )}>
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-ink text-[13px] font-medium">{item.title}</p>
                  <p className="text-ink-muted mt-0.5 truncate text-[12px]">{item.detail}</p>
                </div>

                <span className="text-ink-subtle shrink-0 text-[11px]">{formatDate(item.timestamp, 'dd MMM')}</span>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
