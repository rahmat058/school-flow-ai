import { BookMarked, LayoutGrid, Link2 } from 'lucide-react'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { AssignSubjectsTab } from '@/features/subjects/components/admin/AssignSubjectsTab'
import { SubjectsTab } from '@/features/subjects/components/admin/SubjectsTab'
import { SummaryTab } from '@/features/subjects/components/admin/SummaryTab'

const TABS = [
  { value: 'subjects', label: 'Subjects', icon: BookMarked },
  { value: 'assign', label: 'Assign Subjects', icon: Link2 },
  { value: 'summary', label: 'Summary', icon: LayoutGrid },
] as const

/** The subject catalogue and the class × subject assignment over it. Only the open tab queries. */
export function SubjectClassPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">
          Subject &amp; Class Assignment
        </h1>
        <p className="text-ink-muted text-[14px]">Manage subjects and assign them to existing classes.</p>
      </header>

      <Tabs defaultValue="subjects">
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

        <TabPanel value="subjects">
          <SubjectsTab />
        </TabPanel>
        <TabPanel value="assign">
          <AssignSubjectsTab />
        </TabPanel>
        <TabPanel value="summary">
          <SummaryTab />
        </TabPanel>
      </Tabs>
    </div>
  )
}
