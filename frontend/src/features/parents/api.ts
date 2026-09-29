import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove, paginationMeta } from '@/services/apiClient'
import { studentKeys } from '@/features/students/api'
import type { Paginated } from '@/types/api'
import type { ParentCreated, ParentInput, ParentListItem } from '@/types/people'

export interface ParentListQuery {
  page: number
  limit: number
  search?: string
}

export const parentKeys = {
  all: ['parents'] as const,
  list: (query: ParentListQuery) => [...parentKeys.all, 'list', query] as const,
  detail: (id: string) => [...parentKeys.all, 'detail', id] as const,
}

export function useParents(query: ParentListQuery) {
  return useQuery({
    queryKey: parentKeys.list(query),
    queryFn: async (): Promise<Paginated<ParentListItem>> => {
      const { data, meta } = await get<ParentListItem[]>('/parents', {
        page: query.page,
        limit: query.limit,
        search: query.search,
      })

      return { items: data, meta: meta ?? paginationMeta('/parents', query.page, query.limit, data.length) }
    },
    // Keeps the current page on screen while the next one loads, instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  })
}

/**
 * Every write refreshes the parents list **and** the roster: a parent's links are the source of the
 * guardian each student row reads, so linking or unlinking changes both screens.
 */
function useParentMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parentKeys.all })
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
    },
  })
}

export function useCreateParent() {
  return useParentMutation(async (input: ParentInput) => (await post<ParentCreated>('/parents', input)).data)
}

export function useUpdateParent() {
  return useParentMutation(
    async ({ id, input }: { id: string; input: ParentInput }) =>
      (await patch<ParentListItem>(`/parents/${id}`, input)).data,
  )
}

export function useDeleteParent() {
  return useParentMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/parents/${id}`)).data)
}
