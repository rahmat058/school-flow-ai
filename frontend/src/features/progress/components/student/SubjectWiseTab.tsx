import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/cn'
import type { ProgressSubjectRow } from '@/types/progress'

interface SubjectWiseTabProps {
  subjects: ProgressSubjectRow[]
}

/** Every subject the class runs, the student's average against the class's, strongest first. */
export function SubjectWiseTab({ subjects }: SubjectWiseTabProps) {
  if (subjects.length === 0) {
    return (
      <p className="border-line bg-surface text-ink-subtle rounded-xl border px-4 py-6 text-[13px]">
        No subjects on record for your class yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {subjects.map((row) => {
        const lead = Number((row.studentPercentage - row.classPercentage).toFixed(1))

        return (
          <article
            key={row.subjectId}
            className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <h3 className="font-display text-ink truncate text-[16px] font-semibold tracking-[-0.02em]">
                  {row.subjectName}
                </h3>
                <span className="bg-canvas text-ink-muted shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium">
                  {row.subjectCode}
                </span>
                <span className="text-ink-subtle shrink-0 text-[12px]">
                  {row.papers} {row.papers === 1 ? 'paper' : 'papers'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tabular-nums',
                    lead >= 0 ? 'bg-success-soft text-success' : 'bg-orange-soft text-warning',
                  )}>
                  {lead >= 0 ? '+' : ''}
                  {lead}% vs class
                </span>
                <span className="bg-primary-soft text-primary rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                  {row.grade}
                </span>
              </div>
            </header>

            <dl className="mt-5 space-y-3">
              <SubjectBar label="You" value={row.studentPercentage} tone="primary" />
              <SubjectBar label="Class average" value={row.classPercentage} tone="muted" />
            </dl>
          </article>
        )
      })}
    </div>
  )
}

function SubjectBar({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'muted' }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="text-ink-muted w-28 shrink-0 text-[13px]">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-3">
        <Progress className="min-w-0 flex-1" value={value} tone={tone === 'primary' ? 'primary' : 'warning'} />
        <span className="text-ink w-12 shrink-0 text-right text-[13px] font-medium tabular-nums">{value}%</span>
      </dd>
    </div>
  )
}
