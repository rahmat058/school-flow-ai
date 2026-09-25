import { Download, TrendingUp, Wallet, WalletCards } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { downloadCsv } from '@/lib/csv'
import { formatDate, formatPaise } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import { useFinanceReport } from '@/features/reports/api'
import { FeeTrendChart } from '@/features/reports/components/admin/FeeTrendChart'
import { ReportStat } from '@/features/reports/components/admin/ReportStat'
import type { PendingFeeRecord } from '@/types/reports'

export function FinanceTab() {
  const finance = useFinanceReport()
  const data = finance.data

  const columns: Array<DataTableColumn<PendingFeeRecord>> = [
    {
      id: 'student',
      header: 'Student',
      cell: (row) => (
        <div>
          <p className="text-ink text-[14px] font-medium">{row.studentName}</p>
          <p className="text-ink-subtle text-[12px]">Class {row.className}</p>
        </div>
      ),
    },
    { id: 'class', header: 'Class', cell: (row) => <span className="tabular-nums">{row.className}</span> },
    {
      id: 'title',
      header: 'Fee Title',
      cell: (row) => <span className="text-ink-muted text-[13px]">{row.feeTitle}</span>,
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
      cell: (row) => <span className="text-success font-medium tabular-nums">{formatPaise(row.paidPaise)}</span>,
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'right',
      cell: (row) => <span className="text-error font-medium tabular-nums">{formatPaise(row.balancePaise)}</span>,
    },
    { id: 'due', header: 'Due Date', cell: (row) => <span className="tabular-nums">{formatDate(row.dueDate)}</span> },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      {finance.isError ? (
        <Alert tone="error" title="Could not load the finance report">
          {finance.error instanceof ApiError ? finance.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      {finance.isPending || !data ? (
        <div className="space-y-6" aria-busy="true">
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-36 rounded-xl" />
            ))}
          </section>
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <ReportStat
              icon={Wallet}
              tone="success"
              label="Total Collected (This Year)"
              value={formatPaise(data.totalCollectedPaise)}
            />
            <ReportStat
              icon={WalletCards}
              tone="warning"
              label="Total Pending"
              value={formatPaise(data.totalPendingPaise)}
            />
            <ReportStat icon={TrendingUp} tone="primary" label="Collection Rate" value={`${data.collectionRate}%`} />
          </section>

          <FeeTrendChart
            title="Monthly Collection vs Pending"
            description="Collected against pending, across the last 12 months"
            trend={data.monthly}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    'finance-monthly.csv',
                    [
                      { header: 'Month', value: (row: (typeof data.monthly)[number]) => row.label },
                      { header: 'Collected', value: (row) => (row.collectedPaise / 100).toFixed(2) },
                      { header: 'Pending', value: (row) => (row.pendingPaise / 100).toFixed(2) },
                    ],
                    data.monthly,
                  )
                }>
                <Download className="size-4" strokeWidth={1.75} />
                Export CSV
              </Button>
            }
          />

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">
                Pending Fee Records ({data.pendingCount})
              </h2>

              <Button
                variant="secondary"
                size="sm"
                disabled={data.pending.length === 0}
                onClick={() =>
                  downloadCsv(
                    'pending-fee-records.csv',
                    [
                      { header: 'Student', value: (row: PendingFeeRecord) => row.studentName },
                      { header: 'Class', value: (row) => row.className },
                      { header: 'Fee Title', value: (row) => row.feeTitle },
                      { header: 'Total', value: (row) => (row.totalPaise / 100).toFixed(2) },
                      { header: 'Paid', value: (row) => (row.paidPaise / 100).toFixed(2) },
                      { header: 'Balance', value: (row) => (row.balancePaise / 100).toFixed(2) },
                      { header: 'Due Date', value: (row) => row.dueDate },
                      { header: 'Status', value: (row) => row.status },
                    ],
                    data.pending,
                  )
                }>
                <Download className="size-4" strokeWidth={1.75} />
                Export
              </Button>
            </div>

            <DataTable
              data={data.pending}
              columns={columns}
              getRowId={(row) => row.invoiceId}
              emptyTitle="Nothing pending"
              emptyDescription="Every invoice raised so far has been settled."
            />
          </section>
        </>
      )}
    </div>
  )
}
