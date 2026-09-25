import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatGrid } from '@/features/dashboard/common/StatGrid'
import { UpcomingExamsCard } from '@/features/dashboard/common/UpcomingExamsCard'
import { AcademicProgressCard } from '@/features/dashboard/parent/AcademicProgressCard'
import { FeeHistoryCard } from '@/features/dashboard/parent/FeeHistoryCard'
import { ParentNoticesCard } from '@/features/dashboard/parent/ParentNoticesCard'
import { PendingHomeworkCard } from '@/features/dashboard/parent/PendingHomeworkCard'
import { RecentResultsCard } from '@/features/dashboard/parent/RecentResultsCard'
import { useParentDashboard } from '@/features/dashboard/api'
import { ApiError } from '@/services/apiClient'
import { useCurrentUser } from '@/store/auth'

/**
 * A guardian's home: one child's attendance, fees, marks, homework and schedule. Deliberately not the
 * school-wide admin view — every figure belongs to the child the guardian picks, and comes from the
 * read model that child's own screens already use, so the two can never disagree.
 */
export function ParentDashboard() {
  const user = useCurrentUser()
  const [studentId, setStudentId] = useState('')
  const dashboard = useParentDashboard(studentId)
  const data = dashboard.data

  if (dashboard.isError) {
    return (
      <Alert tone="error" title="Could not load your child's dashboard">
        {dashboard.error instanceof ApiError ? dashboard.error.message : 'Please try again in a moment.'}
      </Alert>
    )
  }

  const childOptions = (data?.children ?? []).map((child) => ({
    value: child.id,
    label: `${child.name} · ${child.className}`,
  }))

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[32px] leading-none font-semibold tracking-[-0.03em]">
            Parent Dashboard
          </h1>
          <p className="text-ink-muted text-[15px]">
            Welcome{user ? `, ${user.firstName} ${user.lastName}` : ''} — monitor your child&rsquo;s progress.
          </p>
        </div>

        {data?.child ? (
          <div className="border-line bg-surface rounded-xl border px-4 py-3 text-right">
            <p className="text-ink text-[14px] font-semibold">{data.child.name}</p>
            <p className="text-ink-muted mt-0.5 text-[12.5px]">
              Class {data.child.className} · Roll {data.child.rollNo}
            </p>
          </div>
        ) : (
          <Skeleton className="h-16 w-44 rounded-xl" />
        )}
      </header>

      {/* Only a guardian with more than one child needs to choose — the payload names them all. */}
      {data && data.children.length > 1 ? (
        <Select
          className="max-w-72"
          options={childOptions}
          value={studentId || data.child?.id || ''}
          onValueChange={setStudentId}
          aria-label="Choose a child"
        />
      ) : null}

      <StatGrid stats={data?.stats ?? []} loading={dashboard.isPending} />

      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-7">
          {data ? <AcademicProgressCard progress={data.progress} /> : <Skeleton className="h-80 rounded-xl" />}
        </div>
        <div className="col-span-12 xl:col-span-5">
          {data ? <RecentResultsCard results={data.results} /> : <Skeleton className="h-80 rounded-xl" />}
        </div>
      </section>

      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          {data ? <PendingHomeworkCard homework={data.homework} /> : <Skeleton className="h-56 rounded-xl" />}
        </div>
      </section>

      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-4">
          {data ? <FeeHistoryCard fees={data.fees} /> : <Skeleton className="h-80 rounded-xl" />}
        </div>
        <div className="col-span-12 xl:col-span-4">
          {data ? <UpcomingExamsCard exams={data.exams} /> : <Skeleton className="h-80 rounded-xl" />}
        </div>
        <div className="col-span-12 xl:col-span-4">
          {data ? <ParentNoticesCard notices={data.notices} /> : <Skeleton className="h-80 rounded-xl" />}
        </div>
      </section>
    </div>
  )
}
