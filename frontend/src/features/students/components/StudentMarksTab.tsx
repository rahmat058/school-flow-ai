import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { useCurrentSchool } from '@/features/school/api'
import { DownloadSheetButton, StudentTabHeader } from '@/features/students/components/DownloadSheetButton'
import { GradeBadge } from '@/features/students/components/GradeBadge'
import type { StudentMarkRow, StudentProfile } from '@/types/people'

interface StudentMarksTabProps {
  profile: StudentProfile
  rows: StudentMarkRow[]
}

/** Marks: one row per paper, newest first, with a downloadable marks sheet. */
export function StudentMarksTab({ profile, rows }: StudentMarksTabProps) {
  const school = useCurrentSchool()

  return (
    <div className="space-y-5">
      <StudentTabHeader
        title="Marks"
        description="Every subject paper this student has a recorded mark for."
        action={
          <DownloadSheetButton
            label="Download marks PDF"
            disabled={rows.length === 0}
            disabledReason="No marks to export yet"
            run={async () => {
              const { downloadMarksPdf } = await import('@/features/students/lib/studentPdf')
              await downloadMarksPdf({ schoolName: school.data?.name ?? 'School', profile, rows })
            }}
          />
        }
      />

      <section className="border-line bg-surface overflow-hidden rounded-xl border shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Subject</TableHead>
              <TableHead>Exam type</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>%</TableHead>
              <TableHead align="right">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-ink-subtle text-[13px]">No marks recorded for this student yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-ink text-[14px] font-medium">{row.subjectName}</TableCell>
                  <TableCell className="text-ink-muted">{row.examType}</TableCell>
                  <TableCell className="text-ink tabular-nums">{row.marks}</TableCell>
                  <TableCell className="text-ink-muted tabular-nums">{row.total}</TableCell>
                  <TableCell className="text-ink-muted tabular-nums">{row.percentage}%</TableCell>
                  <TableCell align="right">
                    <GradeBadge grade={row.grade} />
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
