import { ChartColumn, ClipboardList, GraduationCap } from 'lucide-react'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { useCurrentUser } from '@/store/auth'
import { ExamsTab } from '@/features/exams/components/admin/ExamsTab'
import { ResultsTab } from '@/features/exams/components/admin/ResultsTab'
import { ParentResultsView } from '@/features/exams/components/parent/ParentResultsView'
import { StudentExamsView } from '@/features/exams/components/student/StudentExamsView'
import { TestsTab } from '@/features/exams/components/admin/TestsTab'

/** Scheduling, mark entry and the marks sheet — the staff view of the same route. */
function StaffExamsView({ canManage }: { canManage: boolean }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Tests &amp; exams</h1>
        <p className="text-ink-muted text-[14px]">Schedule unit tests and multi-subject exams for classes.</p>
      </header>

      <Tabs defaultValue="tests">
        <TabList>
          <Tab value="tests">
            <span className="flex items-center gap-2">
              <ClipboardList className="size-4" strokeWidth={1.75} />
              Tests
            </span>
          </Tab>
          <Tab value="exams">
            <span className="flex items-center gap-2">
              <GraduationCap className="size-4" strokeWidth={1.75} />
              Exams
            </span>
          </Tab>
          {canManage ? (
            <Tab value="results">
              <span className="flex items-center gap-2">
                <ChartColumn className="size-4" strokeWidth={1.75} />
                Results
              </span>
            </Tab>
          ) : null}
        </TabList>

        <TabPanel value="tests">
          <TestsTab canManage={canManage} />
        </TabPanel>

        <TabPanel value="exams">
          <ExamsTab canManage={canManage} />
        </TabPanel>

        {canManage ? (
          <TabPanel value="results">
            <ResultsTab />
          </TabPanel>
        ) : null}
      </Tabs>
    </div>
  )
}

/**
 * A student reads their own tests, exams and marks; a guardian reads one of their children's
 * published marks; everyone else gets the schedule, with the marks sheet and write controls reserved
 * for staff — per the API contract.
 */
export function ExamsPage() {
  const user = useCurrentUser()

  if (user?.role === 'STUDENT') return <StudentExamsView />
  if (user?.role === 'PARENT') return <ParentResultsView />

  return <StaffExamsView canManage={user?.role === 'ADMIN' || user?.role === 'TEACHER'} />
}
