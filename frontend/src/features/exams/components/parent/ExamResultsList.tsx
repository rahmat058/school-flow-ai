import { ArrowDownRight, ArrowUpRight, BookOpen } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { EXAM_TYPE_LABELS } from '@/lib/options'
import type { StudentResultRow } from '@/types/exams'

interface ExamResultsListProps {
  results: StudentResultRow[]
}

/**
 * Every published mark as its own card — the newest `StudentResultRow` first. The arrow beside a
 * percentage compares the row with the **next one in this list**, which is the paper sat before it,
 * so the trend is read off two rows the screen actually shows rather than a hidden series.
 */
export function ExamResultsList({ results }: ExamResultsListProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">All exam results</h2>
          <p className="text-ink-muted mt-1 text-[13px]">Every published mark, newest first</p>
        </div>

        <span className="text-ink-muted text-[12px]">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {results.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">No marks have been published yet.</p>
      ) : (
        <ul className="divide-line divide-y">
          {results.map((row, index) => {
            const older = results[index + 1]
            const lead = older ? Number((row.percentage - older.percentage).toFixed(1)) : 0
            const TrendIcon = lead < 0 ? ArrowDownRight : ArrowUpRight
            const passed = row.result === 'PASS'

            return (
              <li key={row.id} className="flex flex-wrap items-center gap-4 py-4">
                <span className="bg-primary-soft text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <BookOpen className="size-4" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-[14px] font-semibold">{row.subjectName}</p>
                  <p className="text-ink-muted mt-0.5 truncate text-[12px]">
                    {row.examName} · {formatDate(row.date, 'dd MMM yyyy')} · {EXAM_TYPE_LABELS[row.examType]}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-4">
                  <div className="text-right">
                    <p className="text-ink text-[13px] font-semibold tabular-nums">
                      {row.marks}/{row.total}
                    </p>
                    {older ? (
                      <p
                        className={cn(
                          'mt-0.5 inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums',
                          lead < 0 ? 'text-error' : 'text-success',
                        )}>
                        <TrendIcon className="size-3" strokeWidth={2} />
                        {row.percentage}%
                      </p>
                    ) : (
                      <p className="text-ink-muted mt-0.5 text-[12px] tabular-nums">{row.percentage}%</p>
                    )}
                  </div>

                  {/* The share draws left-anchored with its value above it, as every share bar does. */}
                  <Progress className="w-16 shrink-0" value={row.percentage} tone={passed ? 'success' : 'error'} />

                  <span className="bg-primary-soft text-primary shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                    {row.grade}
                  </span>

                  <StatusBadge status={row.result} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
