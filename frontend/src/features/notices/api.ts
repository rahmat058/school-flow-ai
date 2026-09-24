import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove } from '@/services/apiClient'
import type { Paginated } from '@/types/api'
import type { Notice, NoticeInput } from '@/types/communication'

export interface NoticeListQuery {
  page: number
  limit: number
  search?: string
}

export const noticeKeys = {
  all: ['notices'] as const,
  list: (query: NoticeListQuery) => [...noticeKeys.all, 'list', query] as const,
}

export function useNotices(query: NoticeListQuery) {
  return useQuery({
    queryKey: noticeKeys.list(query),
    queryFn: async (): Promise<Paginated<Notice>> => {
      const { data, meta } = await get<Notice[]>('/notices', {
        page: query.page,
        limit: query.limit,
        search: query.search,
      })

      return { items: data, meta: meta ?? { page: query.page, limit: query.limit, total: data.length } }
    },
    placeholderData: keepPreviousData,
  })
}

/** Every write invalidates the board, so the list reflects the change in one place. */
function useNoticeMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noticeKeys.all }),
  })
}

export function useCreateNotice() {
  return useNoticeMutation(async (input: NoticeInput) => (await post<Notice>('/notices', input)).data)
}

export function useUpdateNotice() {
  return useNoticeMutation(
    async ({ id, input }: { id: string; input: NoticeInput }) => (await patch<Notice>(`/notices/${id}`, input)).data,
  )
}

export function useDeleteNotice() {
  return useNoticeMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/notices/${id}`)).data)
}
