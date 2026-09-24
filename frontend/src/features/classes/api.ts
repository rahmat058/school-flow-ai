import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { ClassOption } from '@/types/academic'

export const classKeys = {
  all: ['classes'] as const,
}

/** Shared by every feature that needs the class list — students, teachers, fees. */
export function useClassOptions() {
  return useQuery({
    queryKey: classKeys.all,
    queryFn: async () => (await get<ClassOption[]>('/classes')).data,
    staleTime: 5 * 60_000,
  })
}
