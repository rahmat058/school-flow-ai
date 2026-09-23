import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { Paginated } from '@/types/api'
import type { Notice } from '@/types/communication'

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
