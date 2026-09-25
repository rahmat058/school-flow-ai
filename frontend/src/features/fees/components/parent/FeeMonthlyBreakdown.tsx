import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { formatPaise } from '@/lib/format'
import type { StudentFeeMonthRow } from '@/types/fees'

interface FeeMonthlyBreakdownProps {
  /** The child's invoices grouped by the month they fall due, newest month first. */
  months: StudentFeeMonthRow[]
}

/** What was billed, paid and still owed in each month the child's invoices fall due. */
export function FeeMonthlyBreakdown({ months }: FeeMonthlyBreakdownProps) {
  return (
    <article className="border-line bg-surface overflow-hidden rounded-xl border shadow-(--shadow-card)">
      <div className="border-line border-b px-5 py-4">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Monthly breakdown</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Each invoice counted once, in the month it falls due</p>
      </div>

      {months.length === 0 ? (
        <p className="text-ink-subtle px-5 py-6 text-[13px]">No invoices have been raised yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Month</TableHead>
              <TableHead align="right">Billed</TableHead>
              <TableHead align="right">Paid</TableHead>
              <TableHead align="right">Balance</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {months.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="text-ink font-medium">{row.label}</TableCell>
                <TableCell align="right" className="tabular-nums">
                  {formatPaise(row.billedPaise)}
                </TableCell>
                <TableCell align="right" className="text-success tabular-nums">
                  {formatPaise(row.paidPaise)}
                </TableCell>
                <TableCell
                  align="right"
                  className={cn('font-semibold tabular-nums', row.balancePaise > 0 ? 'text-error' : 'text-ink')}>
                  {formatPaise(row.balancePaise)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </article>
  )
}
