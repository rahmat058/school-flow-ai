import type { AttendanceRecord, AttendanceStatus } from '@/types/attendance'
import { SCHOOL_ID, recentSchoolDays } from '@/data/seed'
import { students } from '@/data/students'

/** How far back the generated register goes. */
const REGISTER_DAYS = recentSchoolDays(12)

/**
 * Mostly present, with a deterministic sprinkling of absences/lates so analytics have something to
 * show. Index arithmetic (never `Math.random`) keeps the register identical between reloads.
 */
function statusFor(studentIndex: number, dayIndex: number): AttendanceStatus {
  if ((studentIndex + dayIndex * 5) % 13 === 0) return 'ABSENT'
  if ((studentIndex * 3 + dayIndex) % 11 === 0) return 'LATE'
  if ((studentIndex + dayIndex) % 17 === 0) return 'LEAVE'
  return 'PRESENT'
}

export const attendance: AttendanceRecord[] = students.flatMap((student, studentOffset) =>
  REGISTER_DAYS.map((date, dayIndex) => ({
    id: `att_${student.id}_${date}`,
    schoolId: SCHOOL_ID,
    classId: student.classId ?? 'cls_1',
    studentId: student.id,
    // The class teacher marks the register.
    markedById: `usr_tch_${(Number(student.classId?.replace('cls_', '') ?? 1) % 8) + 1}`,
    attendanceDate: date,
    status: statusFor(studentOffset + 1, dayIndex),
    note: null,
  })),
)

export const registerDays = REGISTER_DAYS

export function attendanceForClassDate(classId: string, date: string): AttendanceRecord[] {
  return attendance.filter((record) => record.classId === classId && record.attendanceDate === date)
}
