import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatPaise } from '@/lib/format'
import { StudentPanel } from '@/features/students/components/StudentPanel'
import type { StudentFees } from '@/types/people'

interface StudentFeesTabProps {
  fees: StudentFees
}

/** Fee history: what has been paid, what is still owed, and every invoice behind those numbers. */
export function StudentFeesTab({ fees }: StudentFeesTabProps) {
  const { summary, rows } = fees

  return (
    <div className="space-y-5">
      <section className="grid gap-5 sm:grid-cols-3">
        <Tile label="Total paid" value={formatPaise(summary.paidPaise)} tone="text-success" />
        <Tile
          label="Outstanding"
          value={formatPaise(summary.duePaise)}
          tone={summary.duePaise > 0 ? 'text-error' : 'text-ink'}
        />
        <Tile label="Total billed" value={formatPaise(summary.totalPaise)} />
      </section>

      <StudentPanel title="Fee history">
        {rows.length === 0 ? (
          <p className="text-ink-subtle text-[13px]">No invoices raised for this student yet.</p>
        ) : (
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
              {rows.map((row) => (
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
              ))}
            </TableBody>
          </Table>
        )}
      </StudentPanel>
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
