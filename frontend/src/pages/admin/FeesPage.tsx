import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { feeKeys } from '@/features/fees/api'
import { CollectFeeTab } from '@/features/fees/components/admin/CollectFeeTab'
import { ConcessionsTab } from '@/features/fees/components/admin/ConcessionsTab'
import { FeeDashboardTab } from '@/features/fees/components/admin/FeeDashboardTab'
import { FeeReportsTab } from '@/features/fees/components/admin/FeeReportsTab'
import { FeeStructureTab } from '@/features/fees/components/admin/FeeStructureTab'

const TABS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'structure', label: 'Fee structure' },
  { value: 'collect', label: 'Collect fee' },
  { value: 'reports', label: 'Reports' },
  { value: 'concessions', label: 'Concessions' },
]

export function FeesPage() {
  const [tab, setTab] = useState('dashboard')
  const queryClient = useQueryClient()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Fee management</h1>
          <p className="text-ink-muted text-[14px]">Class-wise fee structure, collection &amp; reports.</p>
        </div>

        <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: feeKeys.all })}>
          <RefreshCw className="size-4" strokeWidth={1.75} />
          Refresh
        </Button>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabList>
          {TABS.map((item) => (
            <Tab key={item.value} value={item.value}>
              {item.label}
            </Tab>
          ))}
        </TabList>

        <TabPanel value="dashboard">
          <FeeDashboardTab />
        </TabPanel>
        <TabPanel value="structure">
          <FeeStructureTab />
        </TabPanel>
        <TabPanel value="collect">
          <CollectFeeTab />
        </TabPanel>
        <TabPanel value="reports">
          <FeeReportsTab />
        </TabPanel>
        <TabPanel value="concessions">
          <ConcessionsTab />
        </TabPanel>
      </Tabs>
    </div>
  )
}
