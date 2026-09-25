import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { AttendanceChart } from '@/features/dashboard/admin/AttendanceChart'
import { ClassPerformanceChart } from '@/features/dashboard/admin/ClassPerformanceChart'
import { CollectionChart } from '@/features/dashboard/admin/CollectionChart'
import { OverviewHeader } from '@/features/dashboard/admin/OverviewHeader'
import { PendingFeesCard } from '@/features/dashboard/admin/PendingFeesCard'
import { RecentActivityCard } from '@/features/dashboard/admin/RecentActivityCard'
import { SchoolCalendarCard } from '@/features/dashboard/admin/SchoolCalendarCard'
import { StatGrid } from '@/features/dashboard/common/StatGrid'
import { UpcomingExamsCard } from '@/features/dashboard/common/UpcomingExamsCard'
import { useDashboardSummary } from '@/features/dashboard/api'
import { ApiError } from '@/services/apiClient'

/** The school-wide overview — the admin's home, and the one a teacher or guardian lands on. */
export function AdminDashboard() {
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

      {/* Side by side: attendance health and money, the two things an admin checks daily. */}
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-6">
          {data ? <AttendanceChart trend={data.attendanceTrend} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
        <div className="col-span-12 xl:col-span-6">
          {data ? (
            <CollectionChart
              monthly={data.collectionTrend}
              quarterly={data.quarterlyTrend}
              highlightedMonth={data.highlightedMonth}
            />
          ) : (
            <Skeleton className="h-105 rounded-xl" />
          )}
        </div>
      </section>

      {/* How the classes are doing, beside what has just happened. */}
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-8">
          {data ? (
            <ClassPerformanceChart performance={data.classPerformance} />
          ) : (
            <Skeleton className="h-105 rounded-xl" />
          )}
        </div>
        <div className="col-span-12 xl:col-span-4">
          {data ? <RecentActivityCard items={data.recentActivity} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
      </section>

      {/* What is coming up, what is owed, and the dates behind both. */}
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-4">
          {data ? <UpcomingExamsCard exams={data.upcomingExams} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
        <div className="col-span-12 xl:col-span-4">
          {data ? <PendingFeesCard fees={data.pendingFees} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
        <div className="col-span-12 xl:col-span-4">
          {data ? <SchoolCalendarCard entries={data.calendarEntries} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
      </section>
    </div>
  )
}
