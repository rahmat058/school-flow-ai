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
}
