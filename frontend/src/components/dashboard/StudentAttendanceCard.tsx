import { cn } from '@/lib/cn'
import { formatDate, humanizeEnum } from '@/lib/format'
import type { StudentAttendanceOverview } from '@/types/dashboard'
import type { AttendanceStatus } from '@/types/attendance'

/**
 * Attendance has its own vocabulary — present, late, leave, absent — so it does not reuse the shared
 * `StatusBadge`, whose `ABSENT` reads neutral for a missing mark in the reports.
 */
const statusStyles: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-success-soft text-success',
  LATE: 'bg-orange-soft text-warning',
  LEAVE: 'bg-primary-soft text-primary',
  ABSENT: 'bg-error-soft text-error',
}

interface StudentAttendanceCardProps {
  attendance: StudentAttendanceOverview
}

/** The register rolled up, then the last few days as they were marked. */
export function StudentAttendanceCard({ attendance }: StudentAttendanceCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Attendance overview</h2>
        <p className="text-ink-muted mt-1 text-[13px]">
          {attendance.rate}% across {attendance.total} register {attendance.total === 1 ? 'day' : 'days'}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <div className="bg-canvas rounded-lg p-3 text-center">
          <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Present</dt>
          <dd className="font-display text-success mt-1 text-[18px] font-semibold">{attendance.present}</dd>
        </div>
        <div className="bg-canvas rounded-lg p-3 text-center">
          <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Absent</dt>
          <dd className="font-display text-error mt-1 text-[18px] font-semibold">{attendance.absent}</dd>
        </div>
        <div className="bg-canvas rounded-lg p-3 text-center">
          <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Late</dt>
          <dd className="font-display text-warning mt-1 text-[18px] font-semibold">{attendance.late}</dd>
        </div>
      </dl>

      <p className="text-ink-subtle mt-5 text-[11px] font-medium tracking-[0.08em] uppercase">Recent days</p>

      {attendance.recent.length === 0 ? (
        <p className="text-ink-subtle mt-3 text-[13px]">No register days on record.</p>
      ) : (
        <ul className="divide-line mt-2 divide-y">
          {attendance.recent.map((record) => (
            <li key={record.date} className="flex items-center gap-3 py-2.5">
              <span className="text-ink flex-1 text-[13px]">{formatDate(record.date, 'EEE, dd MMM')}</span>
              <span className="text-ink-muted shrink-0 truncate text-[12px]">{record.className}</span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                  statusStyles[record.status],
                )}>
                {humanizeEnum(record.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
