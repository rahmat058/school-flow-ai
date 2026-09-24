import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { FieldOption } from '@/lib/options'
import type { Subject } from '@/types/academic'

export const subjectKeys = {
  all: ['subjects'] as const,
  list: (query: SubjectListQuery = {}) => [...subjectKeys.all, 'list', query] as const,
}

export interface SubjectListQuery {
  classId?: string
  teacherId?: string
}

export function useSubjects(query: SubjectListQuery = {}) {
  return useQuery({
    queryKey: subjectKeys.list(query),
    queryFn: async () =>
      (await get<Subject[]>('/subjects', { classId: query.classId, teacherId: query.teacherId })).data,
    staleTime: 5 * 60_000,
  })
}

/** The school's catalogue as a select list: the same subject is taught in every class, so collapse. */
export function useSubjectOptions(): FieldOption[] {
  const subjects = useSubjects()

  return [...new Set((subjects.data ?? []).map((subject) => subject.name))]
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({ value: name, label: name }))
}
