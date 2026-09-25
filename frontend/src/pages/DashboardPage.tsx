import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  AttendanceChart,
  ClassPerformanceChart,
  CollectionChart,
  OverviewHeader,
  PendingFeesCard,
  RecentActivityCard,
  SchoolCalendarCard,
  StatGrid,
  StudentDashboard,
  UpcomingExamsCard,
} from '@/components/dashboard'
import { useDashboardSummary } from '@/features/dashboard/api'
import { ApiError } from '@/services/apiClient'
import { useCurrentUser } from '@/store/auth'

/** The school-wide overview — the admin's (and, for now, everyone but a student's) home. */
function AdminDashboard() {
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

/** The role decides which home opens: a student reads their own day, everyone else the school's. */
export function DashboardPage() {
  const user = useCurrentUser()

  if (user?.role === 'STUDENT') return <StudentDashboard />

  return <AdminDashboard />
}
