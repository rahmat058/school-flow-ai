import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { GradeBadge } from '@/features/students/components/GradeBadge'
import { StudentPanel } from '@/features/students/components/StudentPanel'
import type { StudentMarkRow } from '@/types/people'

interface StudentMarksTabProps {
  rows: StudentMarkRow[]
}

/** Marks: one row per paper, newest first. */
export function StudentMarksTab({ rows }: StudentMarksTabProps) {
  return (
    <StudentPanel title="Marks">
      {rows.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">No marks recorded for this student yet.</p>
      ) : (
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
            {rows.map((row) => (
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
            ))}
          </TableBody>
        </Table>
      )}
    </StudentPanel>
  )
}
