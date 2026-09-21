import { StatCard } from '@/components/dashboard/StatCard'
import { stats } from '@/data/dashboard'

export function StatGrid() {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((metric) => (
        <StatCard key={metric.id} metric={metric} />
      ))}
    </section>
  )
}
