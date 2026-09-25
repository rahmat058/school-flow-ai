import { ClipboardList } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { ParentHomeworkRow } from '@/types/dashboard'

interface PendingHomeworkCardProps {
  homework: ParentHomeworkRow[]
}

/** Assignments on the child's class they have not submitted yet, soonest due first. */
export function PendingHomeworkCard({ homework }: PendingHomeworkCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Pending homework</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Assignments still to be handed in</p>
      </div>

      {homework.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">Nothing outstanding — every assignment is in.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {homework.map((row) => (
            <li
              key={row.id}
              className={cn(
                'border-line bg-canvas flex flex-col gap-2 rounded-lg border p-4',
                row.daysAway < 0 && 'border-error/30',
              )}>
              <div className="flex items-start gap-2.5">
                <span className="bg-primary-soft text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <ClipboardList className="size-4" strokeWidth={1.75} />
                </span>

                <div className="min-w-0">
                  <p className="text-ink truncate text-[13px] font-semibold">{row.subjectName}</p>
                  <p className="text-ink-muted mt-0.5 line-clamp-2 text-[12px] leading-relaxed">{row.title}</p>
                </div>
              </div>

              <p
                className={cn(
                  'text-[12px] font-medium tabular-nums',
                  row.daysAway < 0 ? 'text-error' : 'text-ink-muted',
                )}>
                {row.daysAway < 0 ? 'Overdue' : 'Due'} {formatDate(row.dueDate, 'dd MMM')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
