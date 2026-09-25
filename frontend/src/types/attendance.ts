import type { StudentSubject } from '@/types/people'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE'

export interface AttendanceRecord {
  id: string
  schoolId: string
  classId: string
  studentId: string
  markedById: string
  /** ISO date (`YYYY-MM-DD`). */
  attendanceDate: string
  status: AttendanceStatus
  note: string | null
}

export interface AttendanceSummary {
  studentId: string
  present: number
  absent: number
  late: number
  leave: number
  /** 0–100, two decimals. */
  percentage: number
}

/** A month that has a register on record — one option of the month picker. */
export interface AttendanceMonthOption {
  /** ISO month key, `2026-08`. */
  value: string
  /** e.g. "August 2026". */
  label: string
}

/** A student a caller may open a register for — their own account, or a guardian's child. */
export type AttendanceSubject = StudentSubject

/** One register day inside a month. */
export interface AttendanceDay {
  date: string
  /** The student's own status — set on a personal month, `null` on a class register. */
  status: AttendanceStatus | null
  present: number
  /** **Includes leave**, so `present + absent + late = total` holds (the rule the roster uses). */
  absent: number
  late: number
  leave: number
  total: number
}

export interface AttendanceMonthTotals {
  present: number
  /** **Includes leave** — the same rule as the day rows and the roster. */
  absent: number
  late: number
  leave: number
  total: number
  /** Present-and-late share, whole percent. */
  rate: number
}

/**
 * One month of the register, already rolled up. `GET /attendance/me` scopes it to a student,
 * `GET /attendance/monthly` to a class — `scope` is what the day row renders from, since only a
 * personal month carries a status per day.
 */
export interface AttendanceMonth {
  scope: 'STUDENT' | 'CLASS'
  /** Whose month it is: the student's name, or the class label. */
  subjectLabel: string
  /** The student's class label (`1-A`); empty for a class register. */
  subjectMeta: string
  /** ISO month key, `2026-08`. */
  month: string
  /** e.g. "August 2026" — the header and the picker read the same label. */
  label: string
  /** Months with a register on record, newest first — so the picker never offers an empty month. */
  availableMonths: AttendanceMonthOption[]
  totals: AttendanceMonthTotals
  /** The month's register days, newest first. */
  days: AttendanceDay[]
}

/** `GET /attendance/me` also names the students the caller may switch between. */
export interface MyAttendanceMonth extends AttendanceMonth {
  /** A student's own account holds one; a guardian's holds their children. */
  students: AttendanceSubject[]
}

/** One student's line on a day's register — the marking sheet's row. */
export interface DailyRegisterRow {
  studentId: string
  name: string
  admissionNo: string
  rollNo: number
  /** The stored status for the day, or `null` when this student has not been marked yet. */
  status: AttendanceStatus | null
  note: string | null
}

/**
 * One day's register for a class — `GET /attendance?classId=&date=`. The roster comes from the class
 * rather than the register, so a day that was never marked still opens with every student and a
 * `null` status, ready to fill.
 */
export interface DailyRegister {
  classId: string
  classLabel: string
  /** ISO date (`YYYY-MM-DD`) — the day the API resolved, which is what a write must echo back. */
  date: string
  rows: DailyRegisterRow[]
  /** True once any student on the day carries a stored status. */
  isMarked: boolean
}

/** One record in the `POST /attendance` batch. */
export interface AttendanceMarkEntry {
  studentId: string
  status: AttendanceStatus
  note?: string | null
}

/**
 * The body of `POST /attendance` — a whole day at once, upserted on `(class, student, date)` so a
 * resubmitted register replaces what is stored instead of duplicating it.
 */
export interface AttendanceMarkInput {
  classId: string
  date: string
  records: AttendanceMarkEntry[]
}
