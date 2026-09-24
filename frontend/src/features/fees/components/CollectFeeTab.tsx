import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CalendarClock, TrendingUp, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPaise } from '@/lib/format'
import { invoiceStatusOptions } from '@/lib/options'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useCollectStudents, useCollectSummary } from '@/features/fees/api'
import { StudentSearchInput } from '@/features/fees/components/StudentSearchInput'
import { feeCollectPath } from '@/routes/paths'
import type { ClassFeeStatusRow, InvoiceStatus } from '@/types/fees'

const PAGE_SIZE = 10

export function CollectFeeTab() {
  const navigate = useNavigate()
  const classOptions = useClassOptions()
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [page, setPage] = useState(1)

  const summary = useCollectSummary({ classId, status })
  const students = useCollectStudents({ page, limit: PAGE_SIZE, classId, status })

  const total = students.data?.meta.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const classSelectOptions = [
    { value: '', label: 'All classes' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  const columns: Array<DataTableColumn<ClassFeeStatusRow>> = [
    {
      id: 'student',
      header: 'Student',
      sortValue: (row) => row.studentName,
      cell: (row) => <span className="text-ink text-[14px] font-medium">{row.studentName}</span>,
    },
    { id: 'class', header: 'Class', sortValue: (row) => row.className, cell: (row) => row.className },
    {
      id: 'admission',
      header: 'Student ID',
      sortValue: (row) => row.admissionNo,
      cell: (row) => <span className="text-ink-subtle font-mono text-[12px]">{row.admissionNo}</span>,
    },
    {
      id: 'due',
      header: 'Total due',
      align: 'right',
      sortValue: (row) => row.totalDuePaise,
      cell: (row) => <span className="tabular-nums">{formatPaise(row.totalDuePaise)}</span>,
    },
    {
      id: 'paid',
      header: 'Paid',
      align: 'right',
      sortValue: (row) => row.paidPaise,
      cell: (row) => <span className="text-success tabular-nums">{formatPaise(row.paidPaise)}</span>,
    },
    {
      id: 'pending',
      header: 'Pending',
      align: 'right',
      sortValue: (row) => row.pendingPaise,
      cell: (row) => (
        <span className={row.pendingPaise > 0 ? 'text-error font-medium tabular-nums' : 'text-ink-muted tabular-nums'}>
          {row.pendingPaise > 0 ? formatPaise(row.pendingPaise) : '—'}
        </span>
      ),
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
    <div className="space-y-5">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summary.isPending ? (
          Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[92px] rounded-xl" />)
        ) : (
          <>
            <SummaryTile
              label="Paid students"
              value={`${summary.data?.paidStudents ?? 0} of ${summary.data?.totalStudents ?? 0}`}
              icon={Users}
              tone="bg-success-soft text-success"
            />
            <SummaryTile
              label="Pending students"
              value={`${summary.data?.pendingStudents ?? 0} defaulters`}
              icon={AlertCircle}
              tone="bg-warning-soft text-warning"
            />
            <SummaryTile
              label="Total collected"
              value={formatPaise(summary.data?.totalCollectedPaise ?? 0)}
              icon={TrendingUp}
              tone="bg-primary-soft text-primary"
            />
            <SummaryTile
              label="Total pending"
              value={formatPaise(summary.data?.totalPendingPaise ?? 0)}
              icon={CalendarClock}
              tone="bg-canvas text-ink-muted"
            />
          </>
        )}
      </section>

      <div className="border-line bg-surface space-y-4 rounded-xl border p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.03em]">
              Class-wise fee status
            </h2>
            <p className="text-ink-muted mt-1 text-[13px]">Collect against any student's outstanding balance.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              className="max-w-[200px]"
              options={classSelectOptions}
              value={classId}
              onValueChange={(value) => {
                setClassId(value)
                setPage(1)
              }}
              aria-label="Filter by class"
            />
            <Select
              className="max-w-[180px]"
              options={invoiceStatusOptions}
              value={status}
              onValueChange={(value) => {
                setStatus(value as InvoiceStatus | '')
                setPage(1)
              }}
              aria-label="Filter by status"
            />
          </div>
        </div>

        <div className="border-line border-t pt-4">
          <StudentSearchInput
            onSelect={(studentId) => navigate(feeCollectPath(studentId))}
            label="Or search individual student"
            placeholder="Type at least 2 characters…"
          />
        </div>

        {students.isError ? (
          <Alert tone="error" title="Could not load fee status">
            {students.error instanceof ApiError ? students.error.message : 'Please try again.'}
          </Alert>
        ) : null}

        <DataTable
          data={students.data?.items ?? []}
          columns={columns}
          getRowId={(row) => row.studentId}
          loading={students.isPending}
          pageSize={PAGE_SIZE}
          page={page}
          pageCount={pageCount}
          total={total}
          onPageChange={setPage}
          emptyTitle="No students match"
          emptyDescription="Try another class or clear the status filter."
        />
      </div>
    </div>
  )
}

interface SummaryTileProps {
  label: string
  value: string
  icon: typeof Users
  tone: string
}

function SummaryTile({ label, value, icon: Icon, tone }: SummaryTileProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">{label}</p>
          <p className="font-display text-ink mt-2 text-[22px] leading-none font-semibold tracking-[-0.03em]">
            {value}
          </p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-4.5" strokeWidth={1.75} />
        </span>
      </div>
    </article>
  )
}
