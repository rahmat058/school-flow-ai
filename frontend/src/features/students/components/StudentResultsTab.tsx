import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { GradeBadge } from '@/features/students/components/GradeBadge'
import type { StudentResults } from '@/types/people'

interface StudentResultsTabProps {
  results: StudentResults
}

/**
 * Results: the pass/fail summary and every paper in one table. No "Download PDF" button — there is
 * no report-card generator yet, and a button that produced nothing would be worse than its absence.
 */
export function StudentResultsTab({ results }: StudentResultsTabProps) {
  const { summary, rows } = results

  return (
    <div className="space-y-5">
      <section className="grid gap-5 sm:grid-cols-3">
        <Tile label="Passed" value={String(summary.passed)} tone="text-success" />
        <Tile label="Failed" value={String(summary.failed)} tone={summary.failed > 0 ? 'text-error' : 'text-ink'} />
        <Tile label="Average" value={`${summary.average}%`} tone="text-primary" />
      </section>

      <section className="border-line bg-surface overflow-hidden rounded-xl border shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>#</TableHead>
              <TableHead>Exam / test</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Result</TableHead>
              <TableHead align="right">Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-ink-subtle text-[13px]">No results recorded yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-ink-subtle tabular-nums">{index + 1}</TableCell>
                  <TableCell className="text-ink text-[14px] font-medium">{row.examName}</TableCell>
                  <TableCell className="text-ink-muted">{row.subjectName}</TableCell>
                  <TableCell className="text-ink-muted">{row.examType}</TableCell>
                  <TableCell className="text-ink-muted whitespace-nowrap">
                    {formatDate(row.date, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-ink tabular-nums">{row.marks}</TableCell>
                  <TableCell className="text-ink-muted tabular-nums">{row.total}</TableCell>
                  <TableCell className="text-ink font-medium tabular-nums">{row.percentage}%</TableCell>
                  <TableCell>
                    <GradeBadge grade={row.grade} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        row.result === 'PASS'
                          ? 'text-success text-[13px] font-medium'
                          : 'text-error text-[13px] font-medium'
                      }>
                      {row.result === 'PASS' ? 'Pass' : 'Fail'}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
                        row.isPublished ? 'bg-success-soft text-success' : 'bg-canvas text-ink-muted',
                      )}>
                      {row.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}

function Tile({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)]">
      <p className="text-ink-muted text-[13px]">{label}</p>
      <p className={`font-display mt-2 text-[26px] leading-none font-semibold tracking-[-0.03em] ${tone}`}>{value}</p>
    </article>
  )
}
