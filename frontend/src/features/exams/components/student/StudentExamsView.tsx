import { ChartColumn, ClipboardList, GraduationCap } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { CountBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { StatGrid } from '@/components/dashboard/common/StatGrid'
import { ApiError } from '@/services/apiClient'
import { useStudentExams } from '@/features/exams/api'
import { StudentExamsTab } from '@/features/exams/components/student/StudentExamsTab'
import { StudentResultsTab } from '@/features/exams/components/student/StudentResultsTab'
import { StudentTestsTab } from '@/features/exams/components/student/StudentTestsTab'

/**
 * The student's own Tests & exams screen: their class's schedule and their own marks. The staff route
 * schedules and enters marks, so this only reads — every row is already scoped to the student.
 */
export function StudentExamsView() {
  const exams = useStudentExams()
  const data = exams.data

  if (exams.isError) {
    return (
      <Alert tone="error" title="Could not load your tests and exams">
        {exams.error instanceof ApiError ? exams.error.message : 'Please try again.'}
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
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Tests &amp; Exams</h1>
        <p className="text-ink-muted text-[14px]">
          Complete schedule with subject-wise dates, marks, and your results.
        </p>
      </header>

      <StatGrid stats={data.stats} />

      <Tabs defaultValue="tests">
        <TabList>
          <Tab value="tests">
            <span className="flex items-center gap-2">
              <ClipboardList className="size-4" strokeWidth={1.75} />
              Tests
              <CountBadge value={data.counts.tests} tone="warning" />
            </span>
          </Tab>

          <Tab value="exams">
            <span className="flex items-center gap-2">
              <GraduationCap className="size-4" strokeWidth={1.75} />
              Exams
              <CountBadge value={data.counts.exams} tone="primary" />
            </span>
          </Tab>

          <Tab value="results">
            <span className="flex items-center gap-2">
              <ChartColumn className="size-4" strokeWidth={1.75} />
              My Results
              <CountBadge value={data.counts.results} tone="success" />
            </span>
          </Tab>
        </TabList>

        <TabPanel value="tests">
          <StudentTestsTab tests={data.upcomingTests} />
        </TabPanel>

        <TabPanel value="exams">
          <StudentExamsTab exams={data.upcomingExams} />
        </TabPanel>

        <TabPanel value="results">
          <StudentResultsTab results={data.results} summary={data.summary} performance={data.subjectPerformance} />
        </TabPanel>
      </Tabs>
    </div>
  )
}
