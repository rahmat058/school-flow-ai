import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove } from '@/services/apiClient'
import type { ClassTimetable, TimetablePeriodInput, TimetableSlotInput } from '@/types/timetable'

export const timetableKeys = {
  all: ['timetable'] as const,
  classWeek: (classId: string) => [...timetableKeys.all, 'class', classId] as const,
}

/** The whole week in one payload: period rows, each day's slots and the stat roll-ups. */
export function useClassTimetable(classId: string) {
  return useQuery({
    queryKey: timetableKeys.classWeek(classId),
    queryFn: async () => (await get<ClassTimetable>(`/timetables/class/${classId}`)).data,
    enabled: classId.length > 0,
  })
}

/** Every write returns the refreshed week, and invalidating the domain keeps one source of truth. */
function useTimetableMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timetableKeys.all }),
  })
}

/** Set one cell's subject/teacher, or clear it by sending both ids null. */
export function useSetSlot(classId: string) {
  return useTimetableMutation(
    async (input: TimetableSlotInput) =>
      (await patch<ClassTimetable>(`/timetables/class/${classId}/slots`, input)).data,
  )
}

/** Append a period row to the class's week — it applies to every day at once. */
export function useAddPeriodRow(classId: string) {
  return useTimetableMutation(
    async (input: TimetablePeriodInput) =>
      (await post<ClassTimetable>(`/timetables/class/${classId}/periods`, input)).data,
  )
}

/** Remove a period row from the class's week, addressed by its position. */
export function useDeletePeriodRow(classId: string) {
  return useTimetableMutation(
    async (orderIndex: number) =>
      (await remove<ClassTimetable>(`/timetables/class/${classId}/periods/${orderIndex}`)).data,
  )
}
