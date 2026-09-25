import { BarChart3, BookOpen, MessageSquareQuote } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { CountBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { StatGrid } from '@/components/dashboard/common/StatGrid'
import { useStudentProgress } from '@/features/progress/api'
import { ProgressOverviewTab } from '@/features/progress/components/student/ProgressOverviewTab'
import { SubjectWiseTab } from '@/features/progress/components/student/SubjectWiseTab'
import { TeacherRemarksTab } from '@/features/progress/components/student/TeacherRemarksTab'
import { ApiError } from '@/services/apiClient'

/**
 * The student's own progress: how the marks have moved, how each subject sits against the class, and
 * what the teachers said. Read-only — every figure is scoped to the signed-in student.
 */
export function ProgressView() {
  const progress = useStudentProgress()
  const data = progress.data

  if (progress.isError) {
    return (
      <Alert tone="error" title="Could not load your progress">
        {progress.error instanceof ApiError ? progress.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-11 rounded-lg" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Progress Tracking</h1>
        <p className="text-ink-muted text-[14px]">Detailed insights into academic performance and growth.</p>
      </header>

      <StatGrid stats={data.stats} />

      <Tabs defaultValue="overview">
        <TabList>
          <Tab value="overview">
            <span className="flex items-center gap-2">
              <BarChart3 className="size-4" strokeWidth={1.75} />
              Overview
            </span>
          </Tab>

          <Tab value="subjects">
            <span className="flex items-center gap-2">
              <BookOpen className="size-4" strokeWidth={1.75} />
              Subject-wise
              <CountBadge value={data.subjects.length} tone="primary" />
            </span>
          </Tab>

          <Tab value="remarks">
            <span className="flex items-center gap-2">
              <MessageSquareQuote className="size-4" strokeWidth={1.75} />
              Teacher Remarks
              <CountBadge value={data.remarks.length} tone="success" />
            </span>
          </Tab>
        </TabList>

        <TabPanel value="overview">
          <ProgressOverviewTab trend={data.trend} subjects={data.subjects} />
        </TabPanel>

        <TabPanel value="subjects">
          <SubjectWiseTab subjects={data.subjects} />
        </TabPanel>

        <TabPanel value="remarks">
          <TeacherRemarksTab remarks={data.remarks} />
        </TabPanel>
      </Tabs>
    </div>
  )
}
