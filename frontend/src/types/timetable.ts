export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export interface Timetable {
  id: string
  schoolId: string
  classId: string
  academicYear: string
  day: Weekday
}

export interface Period {
  id: string
  schoolId: string
  timetableId: string
  subjectId: string | null
  teacherId: string | null
  /** `HH:mm` 24-hour, as Postgres `time`. */
  startTime: string
  endTime: string
  isBreak: boolean
  orderIndex: number
  room: string | null
  /** Named rows ("Short Break", "Assembly"); a numbered row leaves this null and derives its label. */
  label: string | null
}

/**
 * One row of the week. The rows are the period structure every day shares — stored per day
 * (`periods` under each day's `timetables` row) but managed class-wide, which is why the API
 * addresses a row by its `orderIndex` rather than by a single period id.
 */
export interface TimetablePeriodRow {
  orderIndex: number
  /** Resolved for display: the stored label, else `Period n` counting teaching rows only. */
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
}

/** One cell of the grid: what a day teaches in one period row. */
export interface TimetableSlot {
  subjectId: string | null
  subjectName: string | null
  teacherId: string | null
  teacherName: string | null
  room: string | null
}

export interface TimetableDay {
  day: Weekday
  /** One entry per period row, in the same order as `ClassTimetable.periods`. */
  slots: TimetableSlot[]
}

/** The roll-ups the stat tiles show — aggregated server-side, not in the view. */
export interface TimetableStats {
  periodRows: number
  /** Period rows that actually teach, times the number of days. */
  weeklySlots: number
  /** Distinct subjects and teachers that appear anywhere in the week. */
  subjects: number
  teachers: number
}

/** `GET /timetables/class/:classId` — the class's week in one payload. */
export interface ClassTimetable {
  classId: string
  className: string
  academicYear: string
  periods: TimetablePeriodRow[]
  days: TimetableDay[]
  stats: TimetableStats
}

/** `PATCH /timetables/class/:classId/slots` — set one cell, or clear it with both ids null. */
export interface TimetableSlotInput {
  day: Weekday
  orderIndex: number
  subjectId: string | null
  teacherId: string | null
}

/** `POST /timetables/class/:classId/periods` — append a row to the class's week. */
export interface TimetablePeriodInput {
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
}
