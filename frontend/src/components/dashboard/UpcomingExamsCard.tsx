import { CalendarDays, FileText } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { UpcomingExam } from '@/types/dashboard'

interface UpcomingExamsCardProps {
  exams: UpcomingExam[]
}

/** Papers still to be sat, soonest first. */
export function UpcomingExamsCard({ exams }: UpcomingExamsCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Upcoming exams</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Subject papers dated today or later</p>
      </div>

      {exams.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">Nothing scheduled.</p>
      ) : (
        <ul className="space-y-4">
          {exams.map((exam) => (
            <li key={exam.id} className="flex items-start gap-3">
              <span className="bg-primary-soft text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-4" strokeWidth={1.75} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13px] font-medium">{exam.title}</p>
                <p className="text-ink-muted mt-0.5 flex items-center gap-1.5 text-[12px]">
                  <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">
                    {formatDate(exam.date, 'dd MMM yyyy')}
                    {exam.className ? ` · Class ${exam.className}` : ''}
                  </span>
                </p>
              </div>

              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  exam.daysAway <= 3 ? 'bg-orange-soft text-warning' : 'bg-canvas text-ink-muted',
                )}>
                {exam.daysAway === 0 ? 'Today' : `In ${exam.daysAway} ${exam.daysAway === 1 ? 'day' : 'days'}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
