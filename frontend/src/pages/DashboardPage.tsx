import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { AiInsightsCard, CollectionChart, OverviewHeader, RecentPaymentsTable, StatGrid } from '@/components/dashboard'
import { useDashboardSummary } from '@/features/dashboard/api'
import { ApiError } from '@/services/apiClient'

export function DashboardPage() {
  const { data, isPending, isError, error } = useDashboardSummary()

  if (isError) {
    return (
      <Alert tone="error" title="Could not load the dashboard">
        {error instanceof ApiError ? error.message : 'Please try again in a moment.'}
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <OverviewHeader />

      <StatGrid stats={data?.stats ?? []} loading={isPending} />

      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-8">
          {data ? (
            <CollectionChart
              monthly={data.collectionTrend}
              quarterly={data.quarterlyTrend}
              highlightedMonth={data.highlightedMonth}
            />
          ) : (
            <Skeleton className="h-[420px] rounded-xl" />
          )}
        </div>
        <div className="col-span-12 xl:col-span-4">
          {data ? <AiInsightsCard insight={data.insight} /> : <Skeleton className="h-[420px] rounded-xl" />}
        </div>
      </section>

      {data ? <RecentPaymentsTable payments={data.recentPayments} /> : null}
    </div>
  )
}
