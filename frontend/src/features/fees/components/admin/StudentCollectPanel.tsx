import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatPaise, humanizeEnum } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import { useCurrentSchool } from '@/features/school/api'
import { useReceipt, useStudentCollect } from '@/features/fees/api'
import { CollectPaymentSheet } from '@/features/fees/components/admin/CollectPaymentSheet'
import { InvoiceSheet } from '@/features/fees/components/admin/InvoiceSheet'
import { ReceiptModal } from '@/features/fees/components/admin/ReceiptModal'
import type { InvoiceCandidateRow, PaymentHistoryRow, Receipt, StudentDueRow } from '@/types/fees'

const SECTION_CARD = 'border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)]'

interface StudentCollectPanelProps {
  studentId: string
}

/** The individual collect view: what is owed, what can be billed, and what has been paid. */
export function StudentCollectPanel({ studentId }: StudentCollectPanelProps) {
  const collect = useStudentCollect(studentId)
  const school = useCurrentSchool()
  const schoolName = school.data?.name ?? 'School'

  const [due, setDue] = useState<StudentDueRow | null>(null)
  const [collectOpen, setCollectOpen] = useState(false)
  const [candidate, setCandidate] = useState<InvoiceCandidateRow | null>(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [historyPaymentId, setHistoryPaymentId] = useState('')

  const data = collect.data

  const dueColumns: Array<DataTableColumn<StudentDueRow>> = [
    {
      id: 'title',
      header: 'Title',
      cell: (row) => <span className="text-ink text-[14px] font-medium">{row.title}</span>,
    },
    {
      id: 'total',
      header: 'Total',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{formatPaise(row.totalPaise)}</span>,
    },
    {
      id: 'paid',
      header: 'Paid',
      align: 'right',
      cell: (row) => (
        <span className={row.paidPaise > 0 ? 'text-success tabular-nums' : 'text-ink-muted tabular-nums'}>
          {row.paidPaise > 0 ? formatPaise(row.paidPaise) : '—'}
        </span>
      ),
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'right',
      cell: (row) => <span className="text-error font-medium tabular-nums">{formatPaise(row.balancePaise)}</span>,
    },
    {
      id: 'due',
      header: 'Due date',
      cell: (row) => <span className="text-ink-muted whitespace-nowrap">{formatDate(row.dueDate)}</span>,
    },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <Button
          size="sm"
          onClick={() => {
            setDue(row)
            setCollectOpen(true)
          }}>
          Collect
        </Button>
      ),
    },
  ]

  const candidateColumns: Array<DataTableColumn<InvoiceCandidateRow>> = [
    {
      id: 'head',
      header: 'Fee head',
      cell: (row) => <span className="text-ink text-[14px] font-medium">{row.title}</span>,
    },
    {
      id: 'gross',
      header: 'Gross',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{formatPaise(row.grossPaise)}</span>,
    },
    {
      id: 'concession',
      header: 'Concession',
      align: 'right',
      cell: (row) => (
        <span className="text-ink-muted tabular-nums">
          {row.concessionPaise > 0 ? `−${formatPaise(row.concessionPaise)}` : '—'}
        </span>
      ),
    },
    {
      id: 'net',
      header: 'Net amount',
      align: 'right',
      cell: (row) => <span className="text-primary font-medium tabular-nums">{formatPaise(row.netPaise)}</span>,
    },
    {
      id: 'frequency',
      header: 'Frequency',
      cell: (row) => (
        <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-[11px] font-medium">
          {humanizeEnum(row.frequency)}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <Button
          size="sm"
          variant="secondary"
          disabled={row.hasInvoice}
          onClick={() => {
            setCandidate(row)
            setInvoiceOpen(true)
          }}>
          + Invoice
        </Button>
      ),
    },
  ]

  const paymentColumns: Array<DataTableColumn<PaymentHistoryRow>> = [
    {
      id: 'receipt',
      header: 'Receipt no',
      cell: (row) => <span className="text-ink-subtle font-mono text-[12px]">{row.receiptNo}</span>,
    },
    { id: 'title', header: 'Title', cell: (row) => <span className="text-ink-muted text-[13px]">{row.title}</span> },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className="text-success font-medium tabular-nums">{formatPaise(row.amountPaise)}</span>,
    },
    {
      id: 'mode',
      header: 'Mode',
      cell: (row) => (
        <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-[11px] font-medium">
          {humanizeEnum(row.method)}
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: (row) => <span className="text-ink-muted whitespace-nowrap">{formatDate(row.paidAt, 'dd MMM yyyy')}</span>,
    },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <Button size="sm" variant="secondary" onClick={() => setHistoryPaymentId(row.id)}>
          Receipt
        </Button>
      ),
    },
  ]

  if (collect.isError) {
    return (
      <Alert tone="error" title="Could not load this student's fees">
        {collect.error instanceof ApiError ? collect.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (collect.isPending || !data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-[104px] rounded-xl" />
        <Skeleton className="h-[220px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className={`${SECTION_CARD} flex flex-wrap items-center justify-between gap-5`}>
        <div className="flex items-center gap-3.5">
          <Avatar name={data.studentName} />
          <div className="min-w-0">
            <h1 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">{data.studentName}</h1>
            <p className="text-ink-muted mt-0.5 text-[13px]">
              {data.className} · ID: {data.admissionNo} · Roll: {data.rollNo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">Total paid</p>
            <p className="font-display text-success mt-1 text-[20px] font-semibold tabular-nums">
              {formatPaise(data.totalPaidPaise)}
            </p>
          </div>
          <div>
            <p className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">Balance</p>
            <p className="font-display text-error mt-1 text-[20px] font-semibold tabular-nums">
              {formatPaise(data.balancePaise)}
            </p>
          </div>
        </div>
      </header>

      <section className={SECTION_CARD}>
        <h2 className="text-ink mb-4 text-[14px] font-medium">Pending / partial dues</h2>
        <DataTable
          data={data.dues}
          columns={dueColumns}
          getRowId={(row) => row.invoiceId}
          pageSize={10}
          emptyTitle="Nothing outstanding"
          emptyDescription="Every demand on this account is settled."
        />
      </section>

      <section className={SECTION_CARD}>
        <h2 className="text-ink mb-4 text-[14px] font-medium">Create new invoice from fee structure</h2>
        <DataTable
          data={data.invoiceCandidates}
          columns={candidateColumns}
          getRowId={(row) => row.feeHeadId}
          pageSize={10}
          emptyTitle="No fee heads for this class"
          emptyDescription="Add heads to the class's fee structure first."
        />
      </section>

      <section className={SECTION_CARD}>
        <h2 className="text-ink mb-4 text-[14px] font-medium">Payment history</h2>
        <DataTable
          data={data.payments}
          columns={paymentColumns}
          getRowId={(row) => row.id}
          pageSize={10}
          emptyTitle="No payments recorded"
          emptyDescription="Collections against this student will appear here."
        />
      </section>

      {/* Keyed on the target and its balance, so each collection mounts with that invoice's amount. */}
      <CollectPaymentSheet
        key={due ? `${due.invoiceId}-${due.balancePaise}` : 'none'}
        open={collectOpen}
        due={due}
        studentName={data.studentName}
        onClose={() => setCollectOpen(false)}
        onRecorded={(next) => {
          setReceipt(next)
          setReceiptOpen(true)
        }}
      />

      <InvoiceSheet
        key={candidate?.feeHeadId ?? 'none'}
        open={invoiceOpen}
        studentId={studentId}
        candidate={candidate}
        onClose={() => setInvoiceOpen(false)}
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
