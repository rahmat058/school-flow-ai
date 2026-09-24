import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove } from '@/services/apiClient'
import type { TeacherCreated, TeacherInput, TeacherListItem } from '@/types/people'

export interface TeacherListQuery {
  search?: string
}

export const teacherKeys = {
  all: ['teachers'] as const,
  list: (query: TeacherListQuery) => [...teacherKeys.all, 'list', query] as const,
}

export function useTeachers(query: TeacherListQuery = {}) {
  return useQuery({
    queryKey: teacherKeys.list(query),
    queryFn: async (): Promise<TeacherListItem[]> =>
      (await get<TeacherListItem[]>('/teachers', { search: query.search })).data,
    // Keeps the grid on screen while a new search lands, instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  })
}

/** Every write invalidates the grid, so it reflects the change without a second source of truth. */
function useTeacherMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.all }),
  })
}

export function useCreateTeacher() {
  return useTeacherMutation(async (input: TeacherInput) => (await post<TeacherCreated>('/teachers', input)).data)
}

export function useUpdateTeacher() {
  return useTeacherMutation(
    async ({ id, input }: { id: string; input: TeacherInput }) =>
      (await patch<TeacherListItem>(`/teachers/${id}`, input)).data,
  )
}

export function useDeleteTeacher() {
  return useTeacherMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/teachers/${id}`)).data)
}
