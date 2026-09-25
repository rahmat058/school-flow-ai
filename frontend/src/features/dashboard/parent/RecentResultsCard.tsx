import { Progress } from '@/components/ui/Progress'
import type { StudentResultRow } from '@/types/exams'

interface RecentResultsCardProps {
  results: StudentResultRow[]
}

/** The child's published marks, newest first — the same rows their own My Results tab lists. */
export function RecentResultsCard({ results }: RecentResultsCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Recent exam results</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Published marks, newest first</p>
      </div>

      {results.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">No marks have been published yet.</p>
      ) : (
        <ul className="divide-line divide-y">
          {results.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13px] font-medium">{row.subjectName}</p>
                <p className="text-ink-muted mt-0.5 truncate text-[12px]">{row.examName}</p>
              </div>

              {/* The share draws left-anchored with its value after it, as every share bar does. */}
              <div className="flex shrink-0 items-center gap-2.5">
                <Progress
                  className="w-16 shrink-0"
                  value={row.percentage}
                  tone={row.result === 'PASS' ? 'success' : 'error'}
                />
                <span className="text-ink w-10 text-[12.5px] font-medium tabular-nums">{row.percentage}%</span>
              </div>

              <span className="bg-primary-soft text-primary shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                {row.grade}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
