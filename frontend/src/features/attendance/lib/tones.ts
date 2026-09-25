import type { AttendanceStatus } from '@/types/attendance'

/**
 * The dot beside a register day — and the marker on the month calendar — carrying the same meaning the
 * attendance badge's tint does, so a day reads identically wherever it appears. Shared rather than
 * re-declared per component: the calendar and the daily list must agree.
 */
export const attendanceDotTone: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-success',
  LATE: 'bg-warning',
  LEAVE: 'bg-primary',
  ABSENT: 'bg-error',
}
