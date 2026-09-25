import { StatusBadge } from '@/components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { formatDate } from '@/lib/format'
import { ExamCountdown } from '@/features/exams/components/student/ExamCountdown'
import type { StudentTestRow } from '@/types/exams'

interface StudentTestsTabProps {
  tests: StudentTestRow[]
}

/** The tests still ahead for the student's own class, soonest first. */
export function StudentTestsTab({ tests }: StudentTestsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">Upcoming tests</h2>
        <span className="text-ink-muted text-[12px]">{tests.length} scheduled</span>
      </div>

      {tests.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">Your class has no tests scheduled right now.</p>
      ) : (
        <div className="border-line overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>#</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Test name</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Date</TableHead>
                <TableHead align="right">Total marks</TableHead>
                <TableHead align="right">Passing marks</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Countdown</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tests.map((test, index) => (
                <TableRow key={test.id}>
                  <TableCell className="text-ink-subtle">{index + 1}</TableCell>

                  <TableCell>
                    <span className="bg-primary-soft text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium">
                      {test.subjectName}
                    </span>
                  </TableCell>

                  <TableCell>
                    <p className="text-ink text-[13px] font-medium">{test.name}</p>
                    {test.description ? (
                      <p className="text-ink-muted mt-0.5 max-w-64 truncate text-[12px]">{test.description}</p>
                    ) : null}
                  </TableCell>

                  <TableCell className="text-ink-muted">{formatDate(test.examDate, 'EEE')}</TableCell>
                  <TableCell className="text-ink-muted whitespace-nowrap">
                    {formatDate(test.examDate, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell align="right" className="tabular-nums">
                    {test.maxMarks}
                  </TableCell>
                  <TableCell align="right" className="tabular-nums">
                    {test.passMarks ?? '—'}
                  </TableCell>
                  <TableCell className="text-ink-muted whitespace-nowrap">{test.durationMin} min</TableCell>
                  <TableCell>
                    <StatusBadge status={test.status} />
                  </TableCell>
                  <TableCell align="right">
                    <ExamCountdown days={test.daysAway} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
