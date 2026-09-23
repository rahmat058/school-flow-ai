import { useEffect, useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { useFeeSummary, useInvoices } from '@/features/fees/api'
import { formatDate, formatPaise } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import type { FeeInvoiceListItem, InvoiceStatus } from '@/types/fees'

const PAGE_SIZE = 10

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
]

const columns: Array<DataTableColumn<FeeInvoiceListItem>> = [
  {
    id: 'student',
    header: 'Student',
    sortValue: (row) => row.studentName,
    cell: (row) => (
      <div className="min-w-0">
        <p className="text-ink text-[14px] font-medium">{row.studentName}</p>
        <p className="text-ink-subtle font-mono text-[12px]">{row.admissionNo}</p>
      </div>
    ),
  },
  { id: 'class', header: 'Class', sortValue: (row) => row.className, cell: (row) => row.className },
  {
    id: 'due',
    header: 'Due',
    sortValue: (row) => row.dueDate,
    cell: (row) => <span className="text-ink-muted">{formatDate(row.dueDate)}</span>,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'right',
    sortValue: (row) => row.amountPaise - row.discountPaise,
    cell: (row) => (
      <div className="text-right">
        <p className="text-ink font-medium">{formatPaise(row.amountPaise - row.discountPaise)}</p>
        {row.discountPaise > 0 ? (
          <p className="text-ink-subtle text-[12px]">−{formatPaise(row.discountPaise)} concession</p>
        ) : null}
      </div>
    ),
  },
  {
    id: 'paid',
    header: 'Paid',
    align: 'right',
    sortValue: (row) => row.paidPaise,
    cell: (row) => <span className="text-ink-muted">{formatPaise(row.paidPaise)}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    sortValue: (row) => row.status,
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    id: 'receipt',
    header: 'Receipt',
    cell: (row) => <span className="text-ink-subtle font-mono text-[12px]">{row.receiptNo ?? '—'}</span>,
  },
]

export function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [search])

  const invoices = useInvoices({ page, limit: PAGE_SIZE, search: debouncedSearch, status })
  const summary = useFeeSummary()

  const total = invoices.data?.meta.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Fee invoices</h1>
        <p className="text-ink-muted text-[14px]">Term invoices with payments, concessions and receipt numbers.</p>
      </header>

      {invoices.isError ? (
        <Alert tone="error" title="Could not load invoices">
          {invoices.error instanceof ApiError ? invoices.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-3">
        {summary.isPending ? (
          Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-[92px] rounded-xl" />)
        ) : (
          <>
            <SummaryTile label="Collected" value={formatPaise(summary.data?.collectedPaise ?? 0)} tone="text-success" />
            <SummaryTile label="Pending" value={formatPaise(summary.data?.pendingPaise ?? 0)} tone="text-warning" />
            <SummaryTile label="Overdue invoices" value={String(summary.data?.overdueCount ?? 0)} tone="text-error" />
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <Input
            icon={Search}
            type="search"
            placeholder="Search student or receipt no."
            aria-label="Search invoices"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          className="max-w-[200px]"
          options={statusOptions}
          value={status}
          onValueChange={(value) => {
            setStatus(value as InvoiceStatus | '')
            setPage(1)
          }}
          aria-label="Filter by status"
        />
      </div>

      <DataTable
        data={invoices.data?.items ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={invoices.isPending}
        pageSize={PAGE_SIZE}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
        emptyIcon={Receipt}
        emptyTitle="No invoices found"
        emptyDescription="No invoice matches the current search and status filter."
      />
    </div>
  )
}

interface SummaryTileProps {
  label: string
  value: string
  tone: string
}

function SummaryTile({ label, value, tone }: SummaryTileProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5">
      <p className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">{label}</p>
      <p className={`font-display mt-2 text-[24px] leading-none font-semibold tracking-[-0.03em] ${tone}`}>{value}</p>
    </article>
  )
}
