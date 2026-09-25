import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/services/apiClient'
import type { AttendanceMarkInput, AttendanceMonth, DailyRegister, MyAttendanceMonth } from '@/types/attendance'

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

export interface DailyRegisterQuery {
  classId: string
  /** ISO date (`YYYY-MM-DD`); omitted, the API answers with the class's newest register day. */
  date?: string
}

export const attendanceKeys = {
  all: ['attendance'] as const,
  mine: (query: MyAttendanceQuery) => [...attendanceKeys.all, 'mine', query] as const,
  classMonth: (query: ClassAttendanceQuery) => [...attendanceKeys.all, 'class', query] as const,
  register: (query: DailyRegisterQuery) => [...attendanceKeys.all, 'register', query] as const,
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

/** One day's register — the class roster pre-filled with what is stored — the marking sheet. */
export function useDailyRegister(query: DailyRegisterQuery) {
  return useQuery({
    queryKey: attendanceKeys.register(query),
    queryFn: async () =>
      (
        await get<DailyRegister>('/attendance', {
          classId: query.classId,
          date: query.date || undefined,
        })
      ).data,
    enabled: query.classId.length > 0,
  })
}

/** Bulk-upsert one day. Every write invalidates the module, so the month view agrees afterwards. */
export function useMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AttendanceMarkInput) => (await post<DailyRegister>('/attendance', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  })
}
