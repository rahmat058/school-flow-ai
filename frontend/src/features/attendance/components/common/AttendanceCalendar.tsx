import { format, getDay, getDaysInMonth, parseISO } from 'date-fns'
import { cn } from '@/lib/cn'
import { attendanceDotTone } from '@/features/attendance/lib/tones'
import type { AttendanceDay, AttendanceStatus } from '@/types/attendance'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const LEGEND: Array<{ status: AttendanceStatus; label: string }> = [
  { status: 'PRESENT', label: 'Present' },
  { status: 'ABSENT', label: 'Absent' },
  { status: 'LATE', label: 'Late' },
]

interface AttendanceCalendarProps {
  /** ISO month key, `2026-08`. */
  month: string
  /** The month's register days; the calendar dots the ones that carry a status. */
  days: AttendanceDay[]
}

/**
 * The month at a glance: every date, dotted where the register holds a status. A day with no register
 * stays bare rather than reading as absent — a school day that was never marked is not a missed day,
 * and the daily list below is what says a day was actually missed. `status` is only present on a
 * personal month, which is why a class register renders no calendar.
 */
export function AttendanceCalendar({ month, days }: AttendanceCalendarProps) {
  const statusByDate = new Map(
    days.flatMap((day) => (day.status ? ([[day.date, day.status]] as Array<[string, AttendanceStatus]>) : [])),
  )

  const first = parseISO(`${month}-01`)
  const leading = getDay(first)
  const total = getDaysInMonth(first)
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">Month at a glance</h2>
          <p className="text-ink-muted mt-1 text-[13px]">Each day the register was taken, as it was marked.</p>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {LEGEND.map((entry) => (
            <li key={entry.status} className="text-ink-muted flex items-center gap-1.5 text-[12px]">
              <span aria-hidden="true" className={cn('size-2 rounded-full', attendanceDotTone[entry.status])} />
              {entry.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((label) => (
          <span
            key={label}
            className="text-ink-subtle text-center text-[10.5px] font-medium tracking-[0.06em] uppercase">
            {label}
          </span>
        ))}

        {/* The month's first weekday decides how many blank cells precede the 1st. */}
        {Array.from({ length: leading }, (_, index) => (
          <span key={`lead-${index}`} />
        ))}

        {Array.from({ length: total }, (_, offset) => {
          const dayNumber = offset + 1
          const date = `${month}-${String(dayNumber).padStart(2, '0')}`
          const status = statusByDate.get(date)
          const isToday = date === today

          return (
            <span key={date} className="flex flex-col items-center gap-1 py-1">
              <span
                className={cn(
                  'inline-flex size-7 items-center justify-center rounded-full text-[12px] tabular-nums',
                  status ? 'text-ink font-medium' : 'text-ink-subtle',
                  isToday && 'ring-primary ring-1',
                )}>
                {dayNumber}
              </span>

              <span
                aria-hidden="true"
                className={cn('size-1.5 rounded-full', status ? attendanceDotTone[status] : 'bg-transparent')}
              />
            </span>
          )
        })}
      </div>
    </article>
  )
}
