import { CalendarDays } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { CalendarEntry } from '@/types/dashboard'

interface SchoolCalendarCardProps {
  /** Dated entries, soonest first — school events and exam papers still ahead. */
  entries: CalendarEntry[]
}

/**
 * Month grid plus the next few dated entries. Themed through react-day-picker's CSS variables in
 * `styles/index.css` rather than by class overrides, which the library's own rules would win.
 */
export function SchoolCalendarCard({ entries }: SchoolCalendarCardProps) {
  const markedDays = entries.map((entry) => new Date(entry.date))
  const upcoming = entries.slice(0, 3)

  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="text-ink-subtle size-4" strokeWidth={1.75} />
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">School calendar</h2>
      </div>

      <DayPicker
        showOutsideDays={false}
        modifiers={{ marked: markedDays }}
        modifiersClassNames={{ marked: 'rdp-day-marked' }}
      />

      <p className="text-ink-subtle mt-5 text-[11px] font-medium tracking-[0.08em] uppercase">Upcoming</p>

      {upcoming.length === 0 ? (
        <p className="text-ink-subtle mt-3 text-[13px]">Nothing on the calendar.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {upcoming.map((entry) => (
            <li key={entry.id} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 size-1.5 shrink-0 rounded-full',
                  entry.kind === 'EXAM' ? 'bg-warning' : 'bg-primary',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13px]">{entry.title}</p>
                <p className="text-ink-subtle text-[11px]">{formatDate(entry.date, 'dd MMM yyyy')}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
