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
