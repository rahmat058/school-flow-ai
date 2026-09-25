import { BarChart3, CalendarCheck, GraduationCap, Wallet } from 'lucide-react'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { AttendanceTab } from '@/features/reports/components/admin/AttendanceTab'
import { ExamResultsTab } from '@/features/reports/components/admin/ExamResultsTab'
import { FinanceTab } from '@/features/reports/components/admin/FinanceTab'
import { OverviewTab } from '@/features/reports/components/admin/OverviewTab'

const TABS = [
  { value: 'overview', label: 'Overview', icon: BarChart3 },
  { value: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { value: 'exam-results', label: 'Exam Results', icon: GraduationCap },
  { value: 'finance', label: 'Finance', icon: Wallet },
] as const

/** Four reports over the same school data. Each tab fetches its own payload, so a slow one never
 *  blocks the others — only the active panel is mounted. */
export function ReportsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Reports</h1>
        <p className="text-ink-muted text-[14px]">Live data across attendance, exams and finances.</p>
      </header>

      <Tabs defaultValue="overview">
        <TabList>
          {TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value}>
              <span className="inline-flex items-center gap-2">
                <tab.icon className="size-4" strokeWidth={1.75} />
                {tab.label}
              </span>
            </Tab>
          ))}
        </TabList>

        <TabPanel value="overview">
          <OverviewTab />
        </TabPanel>
        <TabPanel value="attendance">
          <AttendanceTab />
        </TabPanel>
        <TabPanel value="exam-results">
          <ExamResultsTab />
        </TabPanel>
        <TabPanel value="finance">
          <FinanceTab />
        </TabPanel>
      </Tabs>
    </div>
  )
}
