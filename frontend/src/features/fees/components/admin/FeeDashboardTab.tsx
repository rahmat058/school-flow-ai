import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, TrendingUp, Wallet } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatPaise } from '@/lib/format'
import { statCardShell, statGradientStyles, statMarkStyles } from '@/lib/statTone'
import { ApiError } from '@/services/apiClient'
import { useFeeDashboard, useFeeSummary, usePendingInvoices } from '@/features/fees/api'
import { feeCollectPath } from '@/routes/paths'
import type { IconTone } from '@/types/dashboard'
import type { FeeTrendPoint, PendingInvoiceRow } from '@/types/fees'

const PAGE_SIZE = 10

export function FeeDashboardTab() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const summary = useFeeSummary()
  const dashboard = useFeeDashboard()
  const pending = usePendingInvoices({ page, limit: PAGE_SIZE })

  const total = pending.data?.meta.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const columns: Array<DataTableColumn<PendingInvoiceRow>> = [
    {
      id: 'student',
      header: 'Student',
      sortValue: (row) => row.studentName,
      cell: (row) => <span className="text-ink text-[14px] font-medium">{row.studentName}</span>,
    },
    { id: 'class', header: 'Class', sortValue: (row) => row.className, cell: (row) => row.className },
    {
      id: 'title',
      header: 'Title',
      sortValue: (row) => row.title,
      cell: (row) => <span className="text-ink-muted text-[13px]">{row.title}</span>,
    },
    {
      id: 'due',
      header: 'Due date',
      sortValue: (row) => row.dueDate,
      cell: (row) => <span className="text-ink-muted whitespace-nowrap">{formatDate(row.dueDate)}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: (row) => row.amountPaise,
      cell: (row) => <span className="tabular-nums">{formatPaise(row.amountPaise)}</span>,
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'right',
      sortValue: (row) => row.balancePaise,
      cell: (row) => <span className="text-error font-medium tabular-nums">{formatPaise(row.balancePaise)}</span>,
    },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <Button size="sm" onClick={() => navigate(feeCollectPath(row.studentId))}>
          Collect
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {summary.isError || dashboard.isError ? (
        <Alert tone="error" title="Could not load the fee dashboard">
          {summary.error instanceof ApiError ? summary.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summary.isPending ? (
          Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[104px] rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Total collected (year)"
              value={formatPaise(summary.data?.collectedPaise ?? 0)}
              detail="Current academic year"
              icon={Wallet}
              tone="primary"
            />
            <StatCard
              label="This month"
              value={formatPaise(summary.data?.thisMonthPaise ?? 0)}
              detail="Collected this month"
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Pending dues"
              value={formatPaise(summary.data?.pendingPaise ?? 0)}
              detail="Across all students"
              icon={CalendarClock}
              tone="warning"
            />
            <StatCard
              label="Defaulters"
              value={String(summary.data?.pendingStudents ?? 0)}
              detail="Students with a due balance"
              icon={AlertTriangle}
              tone="error"
            />
          </>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
          <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.03em]">
            Monthly collection trend
          </h2>
          <p className="text-ink-muted mt-1 text-[13px]">Collected against pending, over twelve months</p>

          <div className="mt-5 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.data?.collectionTrend ?? []} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const point = payload[0].payload as FeeTrendPoint

                    return (
                      <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                        <p className="text-ink-muted">{point.label}</p>
                        <p className="text-ink">Collected: {formatPaise(point.collectedPaise)}</p>
                        <p className="text-ink">Pending: {formatPaise(point.pendingPaise)}</p>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="collectedPaise"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={16}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="pendingPaise"
                  fill="#F59E0B"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={16}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
          <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.03em]">Class-wise collection</h2>
          <p className="text-ink-muted mt-1 text-[13px]">Collected per class, all structures</p>

          <div className="mt-5 h-[260px] w-full overflow-x-auto">
            <div className="h-full min-w-[640px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.data?.classCollection ?? []} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9C9C9C', fontSize: 10, fontFamily: 'DM Sans' }}
                    dy={8}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null

                      return (
                        <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                          <p className="text-ink-muted">{payload[0].payload.label}</p>
                          <p className="text-ink font-medium">{formatPaise(Number(payload[0].value))}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.03em]">
            Pending / defaulter list
          </h2>
          <span className="bg-error-soft text-error rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.04em] uppercase">
            {total} records
          </span>
        </div>

        <DataTable
          data={pending.data?.items ?? []}
          columns={columns}
          getRowId={(row) => row.invoiceId}
          loading={pending.isPending}
          pageSize={PAGE_SIZE}
          page={page}
          pageCount={pageCount}
          total={total}
          onPageChange={setPage}
          emptyTitle="Nothing outstanding"
          emptyDescription="Every student has settled their dues."
        />
      </section>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  detail: string
  icon: typeof Wallet
  tone: IconTone
}

function StatCard({ label, value, detail, icon: Icon, tone }: StatCardProps) {
  return (
    <article className={`${statCardShell} ${statGradientStyles[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.04em] text-white/80 uppercase">{label}</p>
          <p className="font-display mt-2 text-[24px] leading-none font-semibold tracking-[-0.03em] text-white">
            {value}
          </p>
          <p className="mt-1.5 text-[12px] text-white/80">{detail}</p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${statMarkStyles}`}>
          <Icon className="size-4.5" strokeWidth={1.75} />
        </span>
      </div>
    </article>
  )
}
