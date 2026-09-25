import { ExamTypeBadge, StatusBadge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { StudentExamsSummary, StudentResultRow, StudentSubjectPerformance } from '@/types/exams'

interface StudentResultsTabProps {
  results: StudentResultRow[]
  summary: StudentExamsSummary
  performance: StudentSubjectPerformance[]
}

/** Every published mark of the student's own, then how each subject is averaging. */
export function StudentResultsTab({ results, summary, performance }: StudentResultsTabProps) {
  return (
    <div className="space-y-5">
      <dl className="flex flex-wrap items-center gap-3">
        <Chip label="Passed" value={String(summary.passed)} tone="text-success" />
        <Chip label="Failed" value={String(summary.failed)} tone={summary.failed > 0 ? 'text-error' : 'text-ink'} />
        <Chip label="Average" value={`${summary.averageScore}%`} tone="text-ink" />
      </dl>

      <article className="border-line bg-surface overflow-hidden rounded-xl border shadow-(--shadow-card)">
        <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.02em]">
            All results ({results.length})
          </h2>
        </div>

        {results.length === 0 ? (
          <p className="text-ink-subtle px-4 py-6 text-[13px]">
            No marks have been published for you yet. They appear here once a teacher publishes them.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>#</TableHead>
                <TableHead>Exam / Test</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead align="right">Obtained</TableHead>
                <TableHead align="right">Out of</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead align="right">Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {results.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-ink-subtle">{index + 1}</TableCell>

                  <TableCell>
                    <p className="text-ink text-[13px] font-medium">{row.examName}</p>
                    {row.remarks ? (
                      <p className="text-ink-muted mt-0.5 max-w-56 truncate text-[12px]">{row.remarks}</p>
                    ) : null}
                  </TableCell>

                  <TableCell className="text-ink-muted">{row.subjectName}</TableCell>

                  <TableCell>
                    <ExamTypeBadge type={row.examType} />
                  </TableCell>

                  <TableCell className="text-ink-muted whitespace-nowrap">
                    {formatDate(row.date, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell align="right" className="tabular-nums">
                    {row.marks}
                  </TableCell>
                  <TableCell align="right" className="tabular-nums">
                    {row.total}
                  </TableCell>
                  <TableCell>
                    {/* The share draws as a slim bar with its percentage beside it, left-anchored like the
                        roster's attendance bar — a right-anchored track reads as filling backwards. */}
                    <div className="flex items-center gap-2.5">
                      <Progress
                        className="w-16 shrink-0"
                        value={row.percentage}
                        tone={row.result === 'PASS' ? 'success' : 'error'}
                      />
                      <span className="text-ink text-[12.5px] font-medium tabular-nums">{row.percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <span className="text-ink font-medium">{row.grade}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.result} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </article>

      {performance.length > 0 ? (
        <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">
            Subject-wise performance
          </h2>
          <p className="text-ink-muted mt-1 text-[13px]">Your average across every paper in each subject.</p>

          <ul className="mt-5 space-y-3">
            {performance.map((row) => (
              <li key={row.subjectName} className="flex items-center gap-3">
                <span className="text-ink w-52 shrink-0 truncate text-[13px]">
                  {row.subjectName}{' '}
                  <span className="text-ink-subtle">
                    ({row.results} {row.results === 1 ? 'result' : 'results'})
                  </span>
                </span>

                <Progress
                  className="min-w-0 flex-1"
                  value={row.percentage}
                  tone={row.percentage >= 60 ? 'success' : 'warning'}
                />

                <span className="text-ink w-12 shrink-0 text-right text-[13px] font-medium tabular-nums">
                  {row.percentage}%
                </span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </div>
  )
}

function Chip({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border-line bg-surface rounded-lg border px-4 py-2">
      <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">{label}</dt>
      <dd className={cn('font-display mt-0.5 text-[18px] font-semibold tracking-[-0.02em]', tone)}>{value}</dd>
    </div>
  )
}
