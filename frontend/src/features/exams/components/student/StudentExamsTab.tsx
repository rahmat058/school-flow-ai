import type { ReactNode } from 'react'
import { ExamTypeBadge, StatusBadge } from '@/components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { formatDate } from '@/lib/format'
import { ExamCountdown } from '@/features/exams/components/student/ExamCountdown'
import type { StudentExamRow } from '@/types/exams'

interface StudentExamsTabProps {
  exams: StudentExamRow[]
}

/** Each exam window still ahead, with its own paper schedule and marks. */
export function StudentExamsTab({ exams }: StudentExamsTabProps) {
  if (exams.length === 0) {
    return <p className="text-ink-subtle text-[13px]">Your class has no exams scheduled right now.</p>
  }

  return (
    <div className="space-y-6">
      {exams.map((exam) => (
        <div key={exam.id} className="space-y-4">
          <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">{exam.name}</h2>
                  <ExamTypeBadge type={exam.type} />
                </div>
                {exam.description ? <p className="text-ink-muted mt-1 text-[13px]">{exam.description}</p> : null}
              </div>

              <StatusBadge status={exam.status} />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Meta label="Start" value={formatDate(exam.startDate, 'dd MMM yyyy')} />
              <Meta label="End" value={formatDate(exam.endDate, 'dd MMM yyyy')} />
              <Meta label="Duration" value={`${exam.durationDays} ${exam.durationDays === 1 ? 'day' : 'days'}`} />
              <Meta label="Starts in" value={<ExamCountdown days={exam.daysAway} />} />
            </dl>
          </article>

          <article className="border-line bg-surface overflow-hidden rounded-xl border shadow-(--shadow-card)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Subject / Paper</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead align="right">Total marks</TableHead>
                  <TableHead align="right">Passing marks</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead align="right">Countdown</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {exam.papers.map((paper, index) => (
                  <TableRow key={paper.id}>
                    <TableCell className="text-ink-subtle">{index + 1}</TableCell>

                    <TableCell>
                      <p className="text-ink text-[13px] font-medium">{paper.subjectName}</p>
                      <p className="text-ink-subtle text-[11px] font-semibold tracking-[0.06em]">{paper.subjectCode}</p>
                    </TableCell>

                    <TableCell className="text-ink-muted">{formatDate(paper.examDate, 'EEE')}</TableCell>
                    <TableCell className="text-ink-muted whitespace-nowrap">
                      {formatDate(paper.examDate, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell align="right" className="tabular-nums">
                      {paper.maxMarks}
                    </TableCell>
                    <TableCell align="right" className="tabular-nums">
                      {paper.passMarks ?? '—'}
                    </TableCell>
                    <TableCell className="text-ink-muted whitespace-nowrap">{paper.durationMin} min</TableCell>
                    <TableCell align="right">
                      <ExamCountdown days={paper.daysAway} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <span className="text-ink text-[13px] font-medium">
                Total ({exam.papers.length} {exam.papers.length === 1 ? 'paper' : 'papers'})
              </span>
              <span className="text-ink text-[13px] font-medium tabular-nums">
                {exam.totalMarks} marks · {exam.totalPassMarks} to pass
              </span>
            </div>
          </article>
        </div>
      ))}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">{label}</dt>
      <dd className="text-ink mt-1 text-[13px] font-medium">{value}</dd>
    </div>
  )
}
