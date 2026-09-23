import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { Paginated } from '@/types/api'
import type { ClassOption } from '@/types/academic'
import type { StudentListItem } from '@/types/people'

export interface StudentListQuery {
  page: number
  limit: number
  search?: string
  classId?: string
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
