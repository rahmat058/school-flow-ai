import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { StudentProgress } from '@/types/progress'

export const progressKeys = {
  all: ['progress'] as const,
  me: () => [...progressKeys.all, 'me'] as const,
}

/**
 * The student's own progress — `GET /progress/me`. Self-scoped by the session, so there is no id to
 * pass and every figure already belongs to the signed-in student.
 */
export function useStudentProgress() {
  return useQuery({
    queryKey: progressKeys.me(),
    queryFn: async (): Promise<StudentProgress> => (await get<StudentProgress>('/progress/me')).data,
  })
}
