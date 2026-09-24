import { BookOpen, Download, TrendingUp, Users, Wallet } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { downloadCsv } from '@/lib/csv'
import { formatPaise } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import { useReportsOverview } from '@/features/reports/api'
import { FeeTrendChart } from '@/features/reports/components/FeeTrendChart'
import { ReportStat } from '@/features/reports/components/ReportStat'
import type { ReportClassOption } from '@/types/reports'

export function OverviewTab() {
  const overview = useReportsOverview()
  const data = overview.data

  if (overview.isError) {
    return (
      <Alert tone="error" title="Could not load the overview">
        {overview.error instanceof ApiError ? overview.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (overview.isPending || !data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </section>
        <Skeleton className="h-[420px] rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStat
          icon={Users}
          tone="primary"
          label="Active Students"
          value={data.activeStudents.toLocaleString('en-US')}
        />
        <ReportStat
          icon={BookOpen}
          tone="primary"
          label="Active Teachers"
          value={data.activeTeachers.toLocaleString('en-US')}
        />
        <ReportStat icon={Wallet} tone="success" label="Total Collected" value={formatPaise(data.collectedPaise)} />
        <ReportStat icon={TrendingUp} tone="warning" label="Fee Pending" value={formatPaise(data.pendingPaise)} />
      </section>

      <FeeTrendChart
        title="Monthly Fee Overview"
        description="Collected against pending, across the last 12 months"
        trend={data.feeTrend}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadCsv(
                'fee-overview.csv',
                [
                  { header: 'Month', value: (row: (typeof data.feeTrend)[number]) => row.label },
                  { header: 'Collected', value: (row) => (row.collectedPaise / 100).toFixed(2) },
                  { header: 'Pending', value: (row) => (row.pendingPaise / 100).toFixed(2) },
                ],
                data.feeTrend,
              )
            }>
            <Download className="size-4" strokeWidth={1.75} />
            Export
          </Button>
        }
      />

      <ClassesCard classes={data.classes} />
    </div>
  )
}

/** The school's classes as a chip grid — the reference's "Classes (20)" card. */
function ClassesCard({ classes }: { classes: ReportClassOption[] }) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Classes ({classes.length})</h2>
      <p className="text-ink-muted mt-1 text-[13px]">Every class a report can be scoped to</p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {classes.map((classRoom) => (
          <li
            key={classRoom.id}
            className="bg-canvas text-ink-muted rounded-md px-3 py-1.5 text-[13px] font-medium tabular-nums">
            {classRoom.label}
          </li>
        ))}
      </ul>
    </article>
  )
}
