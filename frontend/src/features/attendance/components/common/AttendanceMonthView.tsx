import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { AttendanceBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { statCardShell, statGradientStyles } from '@/lib/statTone'
import { AttendanceCalendar } from '@/features/attendance/components/common/AttendanceCalendar'
import { attendanceDotTone } from '@/features/attendance/lib/tones'
import type { AttendanceDay, AttendanceMonth } from '@/types/attendance'
import type { IconTone } from '@/types/dashboard'

interface AttendanceMonthViewProps {
  data: AttendanceMonth
  title: string
  description: string
  /** The class or student picker, beside the month navigation. */
  subjectPicker?: ReactNode
  /** Whose record this is, top-right of the header — a guardian's child, with their class. */
  subjectChip?: ReactNode
  /** A write action beside the month navigation — only the staff panel passes one. */
  action?: ReactNode
  onMonthChange: (month: string) => void
}

/**
 * One month of the register: the month navigator with its rate, the four counts, the calendar, then
 * the day-by-day rows. A personal month carries a status per day — so it gets the calendar — while a
 * class month carries that day's counts instead; `scope` is what decides.
 */
export function AttendanceMonthView({
  data,
  title,
  description,
  subjectPicker,
  subjectChip,
  action,
  onMonthChange,
}: AttendanceMonthViewProps) {
  const months = data.availableMonths
  const index = months.findIndex((option) => option.value === data.month)
  // The options are newest first, so "newer" is one step up the list.
  const newer = index > 0 ? months[index - 1] : undefined
  const older = index >= 0 && index < months.length - 1 ? months[index + 1] : undefined

  return (
    <div className="space-y-6">
      {/* The chip already names the child and their class, so the line below stands in only without it. */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="text-ink-muted text-[14px]">{description}</p>
          {data.subjectMeta && !subjectChip ? (
            <p className="text-ink-subtle text-[13px]">
              {data.subjectLabel} · Class {data.subjectMeta}
            </p>
          ) : null}
        </div>

        {subjectChip}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {subjectPicker}

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Older month"
            disabled={!older}
            onClick={() => older && onMonthChange(older.value)}>
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </Button>

          <Select className="w-48" options={months} value={data.month} onValueChange={onMonthChange} />

          <Button
            variant="secondary"
            size="sm"
            aria-label="Newer month"
            disabled={!newer}
            onClick={() => newer && onMonthChange(newer.value)}>
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </Button>
        </div>

        {action}

        <span
          className={cn(
            'ml-auto rounded-full px-3 py-1 text-[13px] font-semibold',
            // Under 75% reads as an alert, the same threshold the profile's Attendance tab uses.
            data.totals.rate >= 75 ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
          )}>
          {data.totals.rate}%
        </span>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Present" value={data.totals.present} tone="success" />
        <StatTile label="Absent" value={data.totals.absent} tone="error" />
        <StatTile label="Late" value={data.totals.late} tone="warning" />
        <StatTile label="Attendance" value={`${data.totals.rate}%`} tone="primary" />
      </section>

      {/* Only a personal month carries a per-day status, so only it can be dotted. */}
      {data.scope === 'STUDENT' ? <AttendanceCalendar month={data.month} days={data.days} /> : null}

      <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-ink-subtle size-4" strokeWidth={1.75} />
            <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">
              {data.label || 'This month'} — Daily Records
            </h2>
          </div>

          <span className="text-ink-muted text-[12px]">
            {data.days.length} school {data.days.length === 1 ? 'day' : 'days'}
          </span>
        </div>

        {data.days.length === 0 ? (
          <p className="text-ink-subtle text-[13px]">No register on record for this month.</p>
        ) : (
          <ul className="divide-line divide-y">
            {data.days.map((day) => (
              <DayRow key={day.date} day={day} scope={data.scope} />
            ))}
          </ul>
        )}
      </article>
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number | string; tone: IconTone }) {
  return (
    <article className={cn(statCardShell, statGradientStyles[tone], 'text-center')}>
      <p className="font-display text-[30px] leading-none font-semibold tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-2 text-[13px] text-white/80">{label}</p>
    </article>
  )
}

function DayRow({ day, scope }: { day: AttendanceDay; scope: AttendanceMonth['scope'] }) {
  if (scope === 'CLASS') {
    const rate = day.total === 0 ? 0 : Math.round(((day.present + day.late) / day.total) * 100)

    return (
      <li className="flex items-center gap-3 py-3">
        <span className="text-ink flex-1 text-[13px]">{formatDate(day.date, 'EEE, dd MMM yyyy')}</span>
        <span className="text-ink-muted hidden shrink-0 text-[12px] tabular-nums sm:inline">
          {day.present} present · {day.absent} absent · {day.late} late
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[11px] font-medium tabular-nums',
            rate >= 75 ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
          )}>
          {rate}%
        </span>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        aria-hidden="true"
        className={cn('size-2 shrink-0 rounded-full', attendanceDotTone[day.status ?? 'ABSENT'])}
      />
      <span className="text-ink flex-1 text-[13px]">{formatDate(day.date, 'EEE, dd MMM yyyy')}</span>
      {day.status ? <AttendanceBadge status={day.status} /> : null}
    </li>
  )
}
