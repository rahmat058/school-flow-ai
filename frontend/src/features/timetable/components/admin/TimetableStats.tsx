import { BookOpen, CalendarDays, ListOrdered, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { LucideIcon } from 'lucide-react'
import type { TeacherTimetableStats, TimetableStats } from '@/types/timetable'

/** The two roll-up shapes the tiles can show, told apart by the scope they come with. */
export type TimetableStatsInput =
  { scope: 'CLASS'; stats: TimetableStats } | { scope: 'TEACHER'; stats: TeacherTimetableStats }

interface TimetableStatsProps {
  /** Null while the week is still loading, which is when the tiles are skeletons. */
  input: TimetableStatsInput | null
}

/** The roll-ups, aggregated by the API — the view never counts the grid itself. */
export function TimetableStats({ input }: TimetableStatsProps) {
  const tiles: Array<{ label: string; value: number; icon: LucideIcon }> =
    input?.scope === 'TEACHER'
      ? [
          { label: 'Weekly lessons', value: input.stats.weeklyLessons, icon: CalendarDays },
          { label: 'Classes', value: input.stats.classes, icon: Users },
          { label: 'Subjects', value: input.stats.subjects, icon: BookOpen },
        ]
      : [
          { label: 'Period rows', value: input?.stats.periodRows ?? 0, icon: ListOrdered },
          { label: 'Weekly slots', value: input?.stats.weeklySlots ?? 0, icon: CalendarDays },
          { label: 'Subjects', value: input?.stats.subjects ?? 0, icon: BookOpen },
          { label: 'Teachers', value: input?.stats.teachers ?? 0, icon: Users },
        ]

  if (!input) {
    return (
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {tiles.map((tile) => (
          <Skeleton key={tile.label} className="h-23 rounded-xl" />
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
