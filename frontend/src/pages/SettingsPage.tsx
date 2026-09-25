import { useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { Bell, Building2, Save, Settings2, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { AcademicTab } from '@/features/school/components/AcademicTab'
import { NotificationsTab } from '@/features/school/components/NotificationsTab'
import { SchoolProfileTab } from '@/features/school/components/SchoolProfileTab'
import { SecurityTab } from '@/features/school/components/SecurityTab'
import { useCurrentSchool } from '@/features/school/api'
import { ApiError } from '@/services/apiClient'

/** One form per tab, all carrying this id so the header's Save button submits whichever is open. */
const SETTINGS_FORM_ID = 'settings-form'

const TABS = [
  { value: 'profile', label: 'School Profile', icon: Building2 },
  { value: 'academic', label: 'Academic', icon: Settings2 },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'security', label: 'Security', icon: ShieldCheck },
] as const

/** The school profile and its settings, split across the four tabs the header's Save button drives. */
export function SettingsPage() {
  const school = useCurrentSchool()
  const [activeTab, setActiveTab] = useState<string>('profile')
  const schoolData = school.data
  // The header button reflects whatever write the open tab is running.
  const saving = useIsMutating() > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Settings</h1>
          <p className="text-ink-muted text-[14px]">Manage your school configuration and preferences.</p>
        </div>

        <Button type="submit" form={SETTINGS_FORM_ID} disabled={saving || !schoolData}>
          {saving ? (
            <Spinner size="sm" className="text-white" label="Saving" />
          ) : (
            <Save className="size-4" strokeWidth={1.75} />
          )}
          Save Changes
        </Button>
      </header>

      {school.isError ? (
        <Alert tone="error" title="Could not load your school settings">
          {school.error instanceof ApiError ? school.error.message : 'Please try again.'}
        </Alert>
      ) : !schoolData ? (
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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

          <TabPanel value="profile">
            <SchoolProfileTab formId={SETTINGS_FORM_ID} school={schoolData} />
          </TabPanel>
          <TabPanel value="academic">
            <AcademicTab formId={SETTINGS_FORM_ID} school={schoolData} />
          </TabPanel>
          <TabPanel value="notifications">
            <NotificationsTab formId={SETTINGS_FORM_ID} school={schoolData} />
          </TabPanel>
          <TabPanel value="security">
            <SecurityTab formId={SETTINGS_FORM_ID} school={schoolData} />
          </TabPanel>
        </Tabs>
      )}
    </div>
  )
}
