import { StatCard } from '@/components/dashboard/StatCard'
import { Skeleton } from '@/components/ui/Skeleton'
import type { StatMetric } from '@/types/dashboard'

interface StatGridProps {
  stats: StatMetric[]
  loading?: boolean
}

export function StatGrid({ stats, loading = false }: StatGridProps) {
  if (loading) {
    return (
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="border-line bg-surface rounded-xl border p-5">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="mt-4 h-3 w-24" />
            <Skeleton className="mt-3 h-6 w-32" />
          </div>
        ))}
      </section>
    )
  }

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((metric) => (
        <StatCard key={metric.id} metric={metric} />
      ))}
    </section>
  )
}
