import { useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { downloadCsv } from '@/lib/csv'
import { monthOptions } from '@/lib/options'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useAttendanceReport } from '@/features/reports/api'
import { AttendanceByClassChart } from '@/features/reports/components/AttendanceByClassChart'
import type { AttendanceReportRow } from '@/types/reports'

export function AttendanceTab() {
  const classOptions = useClassOptions()
  const today = new Date()
  const [draft, setDraft] = useState({
    month: String(today.getMonth() + 1),
    year: String(today.getFullYear()),
    classId: '',
  })
  // Filters are staged: the reference's "Generate" commits the draft, so the report is not re-fetched
  // on every keystroke of a select.
  const [applied, setApplied] = useState(draft)

  const report = useAttendanceReport({
    month: Number(applied.month),
    year: Number(applied.year),
    classId: applied.classId,
  })
  const rows = report.data?.byClass ?? []

  const yearOptions = [
    { value: String(today.getFullYear()), label: String(today.getFullYear()) },
    { value: String(today.getFullYear() - 1), label: String(today.getFullYear() - 1) },
  ]
  const classSelectOptions = [
    { value: '', label: 'All Classes' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          className="max-w-45"
          label="Month"
          options={monthOptions}
          value={draft.month}
          onValueChange={(value) => setDraft((current) => ({ ...current, month: value }))}
        />
        <Select
          className="max-w-45"
          label="Year"
          options={yearOptions}
          value={draft.year}
          onValueChange={(value) => setDraft((current) => ({ ...current, year: value }))}
        />
        <Select
          className="max-w-45"
          label="Class"
          options={classSelectOptions}
          value={draft.classId}
          onValueChange={(value) => setDraft((current) => ({ ...current, classId: value }))}
        />

        <Button onClick={() => setApplied(draft)}>
          <BarChart3 className="size-4" strokeWidth={1.75} />
          Generate
        </Button>

        <Button
          variant="secondary"
          className="ml-auto"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv(
              `attendance-${applied.year}-${applied.month.padStart(2, '0')}.csv`,
              [
                { header: 'Class', value: (row: AttendanceReportRow) => row.className },
                { header: 'Present', value: (row) => row.present },
                { header: 'Total', value: (row) => row.total },
                { header: 'Percentage', value: (row) => row.percentage },
              ],
              rows,
            )
          }>
          <Download className="size-4" strokeWidth={1.75} />
          Export CSV
        </Button>
      </div>

      {report.isError ? (
        <Alert tone="error" title="Could not load the attendance report">
          {report.error instanceof ApiError ? report.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      {report.isPending ? (
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <Alert tone="info" title={`No register on record for ${report.data?.label ?? 'that month'}`}>
          The demo school marks attendance on recent school days only — pick a month from the current term.
        </Alert>
      ) : (
        <>
          <AttendanceByClassChart label={report.data?.label ?? ''} rows={rows} />

          <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
            <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Class-wise Summary</h2>

            <ul className="divide-line mt-2 divide-y">
              {rows.map((row) => (
                <li key={row.classId} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-ink text-[14px] font-semibold">{row.className}</p>
                    <p className="text-ink-muted text-[12px]">
                      {row.present} present out of {row.total} total
                    </p>
                  </div>

                  <span
                    className={cn(
                      'shrink-0 rounded-md px-3 py-1 text-[12px] font-medium tabular-nums',
                      row.percentage >= 90 ? 'bg-success-soft text-success' : 'bg-orange-soft text-warning',
                    )}>
                    {row.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </>
      )}
    </div>
  )
}
