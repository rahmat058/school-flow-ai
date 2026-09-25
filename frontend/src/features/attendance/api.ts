import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { AttendanceMonth, MyAttendanceMonth } from '@/types/attendance'

export interface MyAttendanceQuery {
  /** ISO month key (`2026-08`); omitted, the API answers with the newest month on record. */
  month?: string
  /** Which of a guardian's children; a student's own register is the default. */
  studentId?: string
}

export interface ClassAttendanceQuery {
  classId: string
  month?: string
}

export const attendanceKeys = {
  all: ['attendance'] as const,
  mine: (query: MyAttendanceQuery) => [...attendanceKeys.all, 'mine', query] as const,
  classMonth: (query: ClassAttendanceQuery) => [...attendanceKeys.all, 'class', query] as const,
}

/** The caller's own register, or a guardian's child's, one month at a time. */
export function useMyAttendance(query: MyAttendanceQuery) {
  return useQuery({
    queryKey: attendanceKeys.mine(query),
    queryFn: async () =>
      (
        await get<MyAttendanceMonth>('/attendance/me', {
          month: query.month || undefined,
          studentId: query.studentId || undefined,
        })
      ).data,
    // Keeps the month on screen while the next one loads, instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  })
}

/** One class's register for a month — the staff view. */
export function useClassAttendance(query: ClassAttendanceQuery) {
  return useQuery({
    queryKey: attendanceKeys.classMonth(query),
    queryFn: async () =>
      (
        await get<AttendanceMonth>('/attendance/monthly', {
          classId: query.classId,
          month: query.month || undefined,
        })
      ).data,
    enabled: query.classId.length > 0,
    placeholderData: keepPreviousData,
  })
}
