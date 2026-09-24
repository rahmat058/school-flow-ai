import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove } from '@/services/apiClient'
import type { HomeworkInput, HomeworkListItem, HomeworkStatus } from '@/types/homework'

export interface HomeworkListQuery {
  search?: string
  classId?: string
  status?: HomeworkStatus | ''
}

export const homeworkKeys = {
  all: ['homework'] as const,
  list: (query: HomeworkListQuery) => [...homeworkKeys.all, 'list', query] as const,
}

/**
 * `GET /homework` is scoped to the caller's role server-side: staff see the school, a student their
 * own class, a parent their children's. The grid renders one list either way.
 */
export function useHomework(query: HomeworkListQuery = {}) {
  return useQuery({
    queryKey: homeworkKeys.list(query),
    queryFn: async (): Promise<HomeworkListItem[]> =>
      (
        await get<HomeworkListItem[]>('/homework', {
          search: query.search || undefined,
          classId: query.classId || undefined,
          status: query.status || undefined,
        })
      ).data,
    // Keeps the grid on screen while a new search lands, instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  })
}

/** Every write invalidates the assignment list, so the grid reflects the change in one place. */
function useHomeworkMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: homeworkKeys.all }),
  })
}

export function useCreateHomework() {
  return useHomeworkMutation(async (input: HomeworkInput) => (await post<HomeworkListItem>('/homework', input)).data)
}

export function useUpdateHomework() {
  return useHomeworkMutation(
    async ({ id, input }: { id: string; input: HomeworkInput }) =>
      (await patch<HomeworkListItem>(`/homework/${id}`, input)).data,
  )
}

export function useDeleteHomework() {
  return useHomeworkMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/homework/${id}`)).data)
}
