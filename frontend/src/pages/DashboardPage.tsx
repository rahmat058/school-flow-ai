import { InsightsCard } from '@/components/dashboard/InsightsCard'
import { OverviewHeader } from '@/components/dashboard/OverviewHeader'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { StatGrid } from '@/components/dashboard/StatGrid'
import { TransactionsTable } from '@/components/dashboard/TransactionsTable'

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <OverviewHeader />
      <StatGrid />
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-8">
          <RevenueChart />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <InsightsCard />
        </div>
      </section>
      <TransactionsTable />
    </div>
  )
}
