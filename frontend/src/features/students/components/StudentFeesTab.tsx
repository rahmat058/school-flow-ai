import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatPaise } from '@/lib/format'
import { useCurrentSchool } from '@/features/school/api'
import { DownloadSheetButton, StudentTabHeader } from '@/features/students/components/DownloadSheetButton'
import type { StudentFees, StudentProfile } from '@/types/people'

interface StudentFeesTabProps {
  profile: StudentProfile
  fees: StudentFees
}

/** Fee history: what has been paid, what is owed, and a downloadable statement. */
export function StudentFeesTab({ profile, fees }: StudentFeesTabProps) {
  const school = useCurrentSchool()
  const { summary, rows } = fees

  return (
    <div className="space-y-5">
      <StudentTabHeader
        title="Fee history"
        description="Every invoice raised against this student, paid or otherwise."
        action={
          <DownloadSheetButton
            label="Download fee statement PDF"
            disabled={rows.length === 0}
            disabledReason="No invoices to export yet"
            run={async () => {
              const { downloadFeesPdf } = await import('@/features/students/lib/studentPdf')
              await downloadFeesPdf({ schoolName: school.data?.name ?? 'School', profile, fees })
            }}
          />
        }
      />

      <section className="grid gap-5 sm:grid-cols-3">
        <Tile label="Total paid" value={formatPaise(summary.paidPaise)} tone="text-success" />
        <Tile
          label="Outstanding"
          value={formatPaise(summary.duePaise)}
          tone={summary.duePaise > 0 ? 'text-error' : 'text-ink'}
        />
        <Tile label="Total billed" value={formatPaise(summary.totalPaise)} />
      </section>

      <section className="border-line bg-surface overflow-hidden rounded-xl border shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Date paid</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead align="right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-ink-subtle text-[13px]">No invoices raised for this student yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-ink text-[14px] font-medium">{row.title}</TableCell>
                  <TableCell className="text-ink-muted tabular-nums">{formatPaise(row.amountPaise)}</TableCell>
                  <TableCell
                    className={
                      row.paidPaise > 0 ? 'text-success font-medium tabular-nums' : 'text-ink-muted tabular-nums'
                    }>
                    {formatPaise(row.paidPaise)}
                  </TableCell>
                  <TableCell className="text-ink-muted whitespace-nowrap">
                    {row.paidAt ? formatDate(row.paidAt, 'dd MMM yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-ink-muted">{row.method ?? '—'}</TableCell>
                  <TableCell align="right">
                    <StatusBadge status={row.status} />
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
