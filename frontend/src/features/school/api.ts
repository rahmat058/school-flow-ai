import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { School } from '@/types/school'

export const schoolKeys = {
  all: ['school'] as const,
  current: () => [...schoolKeys.all, 'current'] as const,
}

/** The signed-in user's school (name, academic year, grading scheme). */
export function useCurrentSchool() {
  return useQuery({
    queryKey: schoolKeys.current(),
    queryFn: async () => (await get<School>('/schools/current')).data,
    staleTime: 10 * 60_000,
  })
}
