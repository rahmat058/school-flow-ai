import { useState } from 'react'
import { BadgeCheck, Clock, Wallet } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { StatGrid } from '@/features/dashboard/common/StatGrid'
import { formatDate, formatPaise, humanizeEnum } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import { useCurrentSchool } from '@/features/school/api'
import { useMyFees, useReceipt } from '@/features/fees/api'
import { PayFeeModal } from '@/features/fees/components/student/PayFeeModal'
import { ReceiptModal } from '@/features/fees/components/common/ReceiptModal'
import type { StatMetric } from '@/types/dashboard'
import type { Receipt, StudentDueRow } from '@/types/fees'

const SECTION_CARD = 'border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)]'

/** A student's own fees: what is settled, what is still owed, and every payment behind the two. */
export function MyFeesPanel() {
  const fees = useMyFees()
  const school = useCurrentSchool()
  const schoolName = school.data?.name ?? 'School'

  const [due, setDue] = useState<StudentDueRow | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [historyPaymentId, setHistoryPaymentId] = useState('')

  const data = fees.data

  if (fees.isError) {
    return (
      <Alert tone="error" title="Could not load your fees">
        {fees.error instanceof ApiError ? fees.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (fees.isPending || !data) {
    return (
      <div className="space-y-5" aria-busy="true">
        <Skeleton className="h-[124px] rounded-xl" />
        <Skeleton className="h-[220px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    )
  }

  const { summary } = data

  const stats: StatMetric[] = [
    {
      id: 'paid',
      label: 'Total Paid',
      value: formatPaise(summary.paidPaise),
      delta: 'Across invoices',
      icon: BadgeCheck,
      iconTone: 'success',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: formatPaise(summary.pendingPaise),
      delta: 'Outstanding',
      icon: Clock,
      iconTone: 'warning',
    },
    {
      id: 'total',
      label: 'Total Fees',
      value: formatPaise(summary.totalPaise),
      delta: 'Paid + pending',
      icon: Wallet,
      iconTone: 'primary',
    },
  ]

  return (
    <div className="space-y-5">
      <StatGrid stats={stats} />

      <section className={SECTION_CARD}>
        <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.02em]">
          Pending dues ({data.dues.length})
        </h2>

        {data.dues.length === 0 ? (
          <p className="text-ink-subtle mt-4 text-[13px]">
            Nothing outstanding — every demand on your account is settled.
          </p>
        ) : (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Fee title</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead align="right">Balance due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.dues.map((row) => (
                  <TableRow key={row.invoiceId}>
                    <TableCell>
                      <p className="text-ink text-[14px] font-medium">{row.title}</p>
                      {row.paidPaise > 0 ? (
                        <p className="text-ink-muted mt-0.5 text-[12px]">
                          {formatPaise(row.paidPaise)} already paid of {formatPaise(row.totalPaise)}
                        </p>
                      ) : null}
                    </TableCell>

                    <TableCell className="text-ink-muted whitespace-nowrap">{formatDate(row.dueDate)}</TableCell>

                    <TableCell align="right" className="text-error font-medium tabular-nums">
                      {formatPaise(row.balancePaise)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setDue(row)
                          setPayOpen(true)
                        }}>
                        Pay Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className={SECTION_CARD}>
        <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.02em]">
          Payment history ({data.payments.length})
        </h2>

        {data.payments.length === 0 ? (
          <p className="text-ink-subtle mt-4 text-[13px]">No payments have been recorded yet.</p>
        ) : (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Receipt no</TableHead>
                  <TableHead>Fee title</TableHead>
                  <TableHead align="right">Amount paid</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Paid on</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.payments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-ink-subtle font-mono text-[12px]">{row.receiptNo}</TableCell>
                    <TableCell className="text-ink-muted text-[13px]">{row.title}</TableCell>
                    <TableCell align="right" className="text-success font-medium tabular-nums">
                      {formatPaise(row.amountPaise)}
                    </TableCell>
                    <TableCell>
                      <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-[11px] font-medium">
                        {humanizeEnum(row.method)}
                      </span>
                    </TableCell>
                    <TableCell className="text-ink-muted whitespace-nowrap">
                      {formatDate(row.paidAt, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="sm" variant="secondary" onClick={() => setHistoryPaymentId(row.id)}>
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Keyed on the target and its balance, so each demand opens with that invoice's amount. */}
      <PayFeeModal
        key={due ? `${due.invoiceId}-${due.balancePaise}` : 'none'}
        open={payOpen}
        due={due}
        onClose={() => setPayOpen(false)}
        onPaid={(next) => {
          setReceipt(next)
          setReceiptOpen(true)
        }}
      />

      <ReceiptModal
        open={receiptOpen}
        receipt={receipt}
        schoolName={schoolName}
        onClose={() => setReceiptOpen(false)}
      />

      {historyPaymentId ? (
        <HistoryReceipt paymentId={historyPaymentId} schoolName={schoolName} onClose={() => setHistoryPaymentId('')} />
      ) : null}
    </div>
  )
}

interface HistoryReceiptProps {
  paymentId: string
  schoolName: string
  onClose: () => void
}

/** Loads one past receipt on demand, so the history table stays a single list payload. */
function HistoryReceipt({ paymentId, schoolName, onClose }: HistoryReceiptProps) {
  const receipt = useReceipt(paymentId)

  return <ReceiptModal open receipt={receipt.data ?? null} schoolName={schoolName} onClose={onClose} />
}
