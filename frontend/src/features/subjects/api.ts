import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove } from '@/services/apiClient'
import type { FieldOption } from '@/lib/options'
import type { AssignmentSummary, ClassAssignment, Subject, SubjectInput, SubjectRow } from '@/types/academic'

export interface SubjectListQuery {
  classId?: string
  teacherId?: string
}

export const subjectKeys = {
  all: ['subjects'] as const,
  list: (query: SubjectListQuery = {}) => [...subjectKeys.all, 'list', query] as const,
  rows: () => [...subjectKeys.all, 'rows'] as const,
  summary: () => [...subjectKeys.all, 'summary'] as const,
  assignment: (classId: string) => [...subjectKeys.all, 'assignment', classId] as const,
}

/** `GET /subjects` is the school's catalogue, optionally scoped to a class's or a teacher's subjects. */
export function useSubjects(query: SubjectListQuery = {}) {
  return useQuery({
    queryKey: subjectKeys.list(query),
    queryFn: async (): Promise<Subject[]> =>
      (
        await get<Subject[]>('/subjects', {
          classId: query.classId || undefined,
          teacherId: query.teacherId || undefined,
        })
      ).data,
    staleTime: 5 * 60_000,
  })
}

/** The catalogue as a select list — a teacher's subject is stored by name, so the value is the name. */
export function useSubjectOptions(): FieldOption[] {
  const subjects = useSubjects()

  return (subjects.data ?? []).map((subject) => ({ value: subject.name, label: subject.name }))
}

/** The Subjects tab's rows: the catalogue plus how many classes offer each subject. */
export function useSubjectRows() {
  return useQuery({
    queryKey: subjectKeys.rows(),
    queryFn: async (): Promise<SubjectRow[]> => (await get<SubjectRow[]>('/subjects/overview')).data,
    placeholderData: keepPreviousData,
  })
}

/**
 * Every write invalidates the whole subject domain — the catalogue, the assignment panels and every
 * form's subject list all derive from it, so nothing is patched by hand.
 */
function useSubjectMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectKeys.all }),
  })
}

export function useCreateSubject() {
  return useSubjectMutation(async (input: SubjectInput) => (await post<SubjectRow>('/subjects', input)).data)
}

export function useUpdateSubject() {
  return useSubjectMutation(
    async ({ id, input }: { id: string; input: SubjectInput }) =>
      (await patch<SubjectRow>(`/subjects/${id}`, input)).data,
  )
}

export function useDeleteSubject() {
  return useSubjectMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/subjects/${id}`)).data)
}

/** The Summary tab: every class, every subject and the matrix between them. */
export function useAssignmentSummary() {
  return useQuery({
    queryKey: subjectKeys.summary(),
    queryFn: async (): Promise<AssignmentSummary> => (await get<AssignmentSummary>('/subjects/summary')).data,
  })
}

/** One class's assigned subjects — the Single Assignment panel. */
export function useClassAssignment(classId: string) {
  return useQuery({
    queryKey: subjectKeys.assignment(classId),
    queryFn: async (): Promise<ClassAssignment> =>
      (await get<ClassAssignment>('/subjects/assignments', { classId })).data,
    enabled: classId.length > 0,
  })
}

/** Adds the ticked subjects to one class. Already-assigned ones are left alone. */
export function useAssignSubjects() {
  return useSubjectMutation(
    async ({ classId, subjectIds }: { classId: string; subjectIds: string[] }) =>
      (await post<ClassAssignment>('/subjects/assignments', { classId, subjectIds })).data,
  )
}

/** Removes one subject from one class. */
export function useRemoveAssignedSubject() {
  return useSubjectMutation(
    async ({ classId, subjectId }: { classId: string; subjectId: string }) =>
      (await remove<ClassAssignment>(`/subjects/assignments/${classId}/${subjectId}`)).data,
  )
}

/** Adds the ticked subjects to every selected class, one request. */
export function useBulkAssignSubjects() {
  return useSubjectMutation(
    async ({ classIds, subjectIds }: { classIds: string[]; subjectIds: string[] }) =>
      (await post<{ added: number }>('/subjects/assignments/bulk', { classIds, subjectIds })).data,
  )
}
