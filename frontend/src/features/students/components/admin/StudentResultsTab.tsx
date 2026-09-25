import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { useCurrentSchool } from '@/features/school/api'
import { DownloadSheetButton, StudentTabHeader } from '@/features/students/components/admin/DownloadSheetButton'
import { GradeBadge } from '@/features/students/components/admin/GradeBadge'
import type { StudentProfile, StudentResults } from '@/types/people'

interface StudentResultsTabProps {
  profile: StudentProfile
  results: StudentResults
}

/** Results: the pass/fail summary, the full table, and a downloadable result sheet. */
export function StudentResultsTab({ profile, results }: StudentResultsTabProps) {
  const school = useCurrentSchool()
  const { summary, rows } = results

  return (
    <div className="space-y-5">
      <StudentTabHeader
        title="Result sheet"
        description="Every paper this student has a recorded mark for."
        action={
          <DownloadSheetButton
            label="Download result PDF"
            disabled={rows.length === 0}
            disabledReason="No results to export yet"
            run={async () => {
              const { downloadResultPdf } = await import('@/features/students/lib/studentPdf')
              await downloadResultPdf({ schoolName: school.data?.name ?? 'School', profile, results, rows })
            }}
          />
        }
      />

      <section className="grid gap-5 sm:grid-cols-3">
        <Tile label="Passed" value={String(summary.passed)} tone="text-success" />
        <Tile label="Failed" value={String(summary.failed)} tone={summary.failed > 0 ? 'text-error' : 'text-ink'} />
        <Tile label="Average" value={`${summary.average}%`} tone="text-primary" />
      </section>

      <section className="border-line bg-surface overflow-hidden rounded-xl border shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-3">Exam / test</TableHead>
              <TableHead className="px-3">Subject</TableHead>
              <TableHead className="px-3">Type</TableHead>
              <TableHead className="px-3">Date</TableHead>
              <TableHead className="px-3">Marks</TableHead>
              <TableHead className="px-3">%</TableHead>
              <TableHead className="px-3">Grade</TableHead>
              <TableHead className="px-3">Result</TableHead>
              <TableHead align="right" className="px-3">
                Published
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-ink-subtle px-3 text-[13px]">No results recorded yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-ink px-3 text-[13.5px] font-medium whitespace-nowrap">
                    {row.examName}
                  </TableCell>
                  <TableCell className="text-ink-muted px-3 whitespace-nowrap">{row.subjectName}</TableCell>
                  <TableCell className="text-ink-muted px-3">{row.examType}</TableCell>
                  <TableCell className="text-ink-muted px-3 whitespace-nowrap">
                    {formatDate(row.date, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-ink px-3 whitespace-nowrap tabular-nums">
                    {row.marks} / {row.total}
                  </TableCell>
                  <TableCell className="text-ink px-3 font-medium tabular-nums">{row.percentage}%</TableCell>
                  <TableCell className="px-3">
                    <GradeBadge grade={row.grade} />
                  </TableCell>
                  <TableCell className="px-3">
                    <span
                      className={cn(
                        'text-[13px] font-medium whitespace-nowrap',
                        row.result === 'PASS' ? 'text-success' : 'text-error',
                      )}>
                      {row.result === 'PASS' ? 'Pass' : 'Fail'}
                    </span>
                  </TableCell>
                  <TableCell align="right" className="px-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap',
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
