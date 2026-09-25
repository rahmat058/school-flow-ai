import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatGrid } from '@/features/dashboard/common/StatGrid'
import { StudentAttendanceCard } from '@/features/dashboard/student/StudentAttendanceCard'
import { StudentFeesCard } from '@/features/dashboard/student/StudentFeesCard'
import { StudentNoticesCard } from '@/features/dashboard/student/StudentNoticesCard'
import { TodayTimetableCard } from '@/features/dashboard/student/TodayTimetableCard'
import { UpcomingExamsCard } from '@/features/dashboard/common/UpcomingExamsCard'
import { useStudentDashboard } from '@/features/dashboard/api'
import { ApiError } from '@/services/apiClient'

/**
 * A student's home: their own attendance, fees, timetable and exams. Deliberately not the admin
 * dashboard — every figure here is scoped to the signed-in student, so the same numbers an admin
 * reads school-wide would be wrong on this screen.
 */
export function StudentDashboard() {
  const { data, isPending, isError, error } = useStudentDashboard()

  if (isError) {
    return (
      <Alert tone="error" title="Could not load your dashboard">
        {error instanceof ApiError ? error.message : 'Please try again in a moment.'}
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[32px] leading-none font-semibold tracking-[-0.03em]">
          Student Dashboard
        </h1>
        <p className="text-ink-muted text-[15px]">Your academic progress and daily activities.</p>
      </header>

      <StatGrid stats={data?.stats ?? []} loading={isPending} />

      {/* The day ahead: what the student sits in, and what they are about to be examined on. */}
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-7">
          {data ? <TodayTimetableCard day={data.today} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
        <div className="col-span-12 xl:col-span-5">
          {data ? <UpcomingExamsCard exams={data.upcomingExams} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
      </section>

      {/* Money and attendance — the two things a student checks most often. */}
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-7">
          {data ? <StudentFeesCard fees={data.fees} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
        <div className="col-span-12 xl:col-span-5">
          {data ? <StudentAttendanceCard attendance={data.attendance} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
      </section>

      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          {data ? <StudentNoticesCard notices={data.notices} /> : <Skeleton className="h-105 rounded-xl" />}
        </div>
      </section>
    </div>
  )
}
