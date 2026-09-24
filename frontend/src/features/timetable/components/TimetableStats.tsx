import { BookOpen, CalendarDays, ListOrdered, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { LucideIcon } from 'lucide-react'
import type { TimetableStats as TimetableStatsData } from '@/types/timetable'

interface TimetableStatsProps {
  stats: TimetableStatsData | null
}

/** The week's roll-ups, aggregated by the API — the page never counts the grid itself. */
export function TimetableStats({ stats }: TimetableStatsProps) {
  const tiles: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: 'Period rows', value: stats?.periodRows ?? 0, icon: ListOrdered },
    { label: 'Weekly slots', value: stats?.weeklySlots ?? 0, icon: CalendarDays },
    { label: 'Subjects', value: stats?.subjects ?? 0, icon: BookOpen },
    { label: 'Teachers', value: stats?.teachers ?? 0, icon: Users },
  ]

  if (!stats) {
    return (
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-23 rounded-xl" />
        ))}
      </section>
    )
  }

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <article key={tile.label} className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">{tile.label}</p>
              <p className="font-display text-ink mt-2 text-[22px] leading-none font-semibold tracking-[-0.03em]">
                {tile.value}
              </p>
            </div>
            <span className="bg-primary-soft text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
              <tile.icon className="size-4.5" strokeWidth={1.75} />
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}
