import type { StudentDay } from '@/types/dashboard'

interface TodayTimetableCardProps {
  /** Today's schedule for the student's class; `null` when today is not a school day. */
  day: StudentDay | null
}

/** The student's own periods for today, in order — breaks are not listed, they are not lessons. */
export function TodayTimetableCard({ day }: TodayTimetableCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Today&apos;s timetable</h2>
          <p className="text-ink-muted mt-1 truncate text-[13px]">
            {day ? `${day.dayLabel} · Class ${day.className}` : 'No classes scheduled'}
          </p>
        </div>

        {day && day.slots.length > 0 ? (
          <span className="bg-canvas text-ink-muted shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium">
            {day.slots.length} periods
          </span>
        ) : null}
      </div>

      {!day || day.slots.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">No classes today.</p>
      ) : (
        <ul className="divide-line divide-y">
          {day.slots.map((slot) => (
            <li key={slot.orderIndex} className="flex items-center gap-3 py-3">
              <span className="bg-canvas text-ink-muted inline-flex min-w-16 shrink-0 items-center justify-center rounded-md px-2 py-1 text-[11px] font-medium">
                {slot.label}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13px] font-medium">{slot.subjectName ?? 'Free period'}</p>
                <p className="text-ink-muted mt-0.5 truncate text-[12px]">{slot.teacherName ?? 'Unassigned'}</p>
              </div>

              <span className="text-ink-muted shrink-0 text-[12px] tabular-nums">
                {slot.startTime}–{slot.endTime}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
