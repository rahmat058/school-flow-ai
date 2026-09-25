import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { useCurrentSchool } from '@/features/school/api'
import { DownloadSheetButton, StudentTabHeader } from '@/features/students/components/admin/DownloadSheetButton'
import type { StudentAttendance, StudentProfile } from '@/types/people'

interface StudentAttendanceTabProps {
  profile: StudentProfile
  attendance: StudentAttendance
}

/** Attendance: the totals, the same figures by month, and a downloadable attendance sheet. */
export function StudentAttendanceTab({ profile, attendance }: StudentAttendanceTabProps) {
  const school = useCurrentSchool()
  const { totals, months } = attendance

  return (
    <div className="space-y-5">
      <StudentTabHeader
        title="Attendance"
        description="Present, absent and late days, overall and month by month."
        action={
          <DownloadSheetButton
            label="Download attendance PDF"
            disabled={totals.total === 0}
            disabledReason="No register entries to export yet"
            run={async () => {
              const { downloadAttendancePdf } = await import('@/features/students/lib/studentPdf')
              await downloadAttendancePdf({ schoolName: school.data?.name ?? 'School', profile, attendance })
            }}
          />
        }
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Total days" value={String(totals.total)} />
        <Tile label="Present" value={String(totals.present)} tone="text-success" />
        <Tile label="Absent" value={String(totals.absent)} tone={totals.absent > 0 ? 'text-error' : 'text-ink'} />
        <Tile label="Late" value={String(totals.late)} tone={totals.late > 0 ? 'text-warning' : 'text-ink'} />
      </section>

      <section className="border-line bg-surface overflow-hidden rounded-xl border shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Month</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Total</TableHead>
              <TableHead align="right">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((month) => (
              <TableRow key={month.month}>
                <TableCell className="text-ink text-[14px] font-medium">{month.month}</TableCell>
                <TableCell className="text-ink-muted">{month.present}</TableCell>
                <TableCell className="text-ink-muted">{month.absent}</TableCell>
                <TableCell className="text-ink-muted">{month.late}</TableCell>
                <TableCell className="text-ink-muted">{month.total}</TableCell>
                <TableCell align="right">
                  <span className={month.rate < 75 ? 'text-error font-medium' : 'text-ink font-medium'}>
                    {month.rate}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <p className="text-ink-subtle text-[12px]">
        Rate counts present and late days together, the same way the roster does. Under 75% reads as an alert.
      </p>
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
