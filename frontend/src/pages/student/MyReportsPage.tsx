import { FileSpreadsheet, Wallet } from 'lucide-react'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { StudentResultsPanel } from '@/features/exams/components/student/StudentResultsPanel'
import { MyFeesPanel } from '@/features/fees/components/student/MyFeesPanel'

const TABS = [
  { value: 'results', label: 'My Results', icon: FileSpreadsheet },
  { value: 'fees', label: 'My Fees', icon: Wallet },
] as const

/**
 * A student's own reports — published results and the fee account. STUDENT-only at the route level,
 * so the page needs no role branching. Distinct from the staff `/reports`.
 */
export function MyReportsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">My Reports</h1>
        <p className="text-ink-muted text-[14px]">Your published exam results and your fee account.</p>
      </header>

      <Tabs defaultValue="results">
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

        <TabPanel value="results">
          <StudentResultsPanel />
        </TabPanel>
        <TabPanel value="fees">
          <MyFeesPanel />
        </TabPanel>
      </Tabs>
    </div>
  )
}
