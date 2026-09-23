import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove } from '@/services/apiClient'
import type { Paginated } from '@/types/api'
import type { ClassOption } from '@/types/academic'
import type { FeeStanding, StudentInput, StudentListItem } from '@/types/people'

export interface StudentListQuery {
  page: number
  limit: number
  search?: string
  classId?: string
  feeStanding?: FeeStanding | ''
}

export const studentKeys = {
  all: ['students'] as const,
  list: (query: StudentListQuery) => [...studentKeys.all, 'list', query] as const,
  classes: () => [...studentKeys.all, 'classes'] as const,
}

export function useStudents(query: StudentListQuery) {
  return useQuery({
    queryKey: studentKeys.list(query),
    queryFn: async (): Promise<Paginated<StudentListItem>> => {
      const { data, meta } = await get<StudentListItem[]>('/students', {
        page: query.page,
        limit: query.limit,
        search: query.search,
        classId: query.classId,
        feeStanding: query.feeStanding || undefined,
      })

      return { items: data, meta: meta ?? { page: query.page, limit: query.limit, total: data.length } }
    },
    // Keeps the current page on screen while the next one loads, instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  })
}

export function useClassOptions() {
  return useQuery({
    queryKey: studentKeys.classes(),
    queryFn: async () => (await get<ClassOption[]>('/classes')).data,
    staleTime: 5 * 60_000,
  })
}

/** Every write invalidates the roster, so the table reflects it without a second source of truth. */
function useRosterMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentKeys.all }),
  })
}

export function useCreateStudent() {
  return useRosterMutation(async (input: StudentInput) => (await post<StudentListItem>('/students', input)).data)
}

export function useUpdateStudent() {
  return useRosterMutation(
    async ({ id, input }: { id: string; input: StudentInput }) =>
      (await patch<StudentListItem>(`/students/${id}`, input)).data,
  )
}

export function useDeleteStudent() {
  return useRosterMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/students/${id}`)).data)
}
