import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove } from '@/services/apiClient'
import type {
  ExamInput,
  ExamListItem,
  ExamType,
  ResultEntryInput,
  ResultSheet,
  StudentExams,
  TestInput,
  TestListItem,
} from '@/types/exams'

export interface TestListQuery {
  classId?: string
  subjectId?: string
}

export interface ExamListQuery {
  classId?: string
  type?: ExamType | ''
}

export const examKeys = {
  all: ['exams'] as const,
  me: (studentId: string) => [...examKeys.all, 'me', studentId] as const,
  tests: (query: TestListQuery) => [...examKeys.all, 'tests', query] as const,
  exams: (query: ExamListQuery) => [...examKeys.all, 'exams', query] as const,
  results: (examId: string) => [...examKeys.all, 'results', examId] as const,
}

/**
 * The caller's own record — `GET /exams/me`. A student reads their own; a guardian names one of their
 * own children with `studentId`, and an empty id asks for the first child, which is what the screen
 * shows until one is picked.
 */
export function useStudentExams(studentId = '') {
  return useQuery({
    queryKey: examKeys.me(studentId),
    queryFn: async (): Promise<StudentExams> =>
      (await get<StudentExams>('/exams/me', { studentId: studentId || undefined })).data,
  })
}

/** Single-subject tests — `GET /exams?kind=TEST`. */
export function useTests(query: TestListQuery = {}) {
  return useQuery({
    queryKey: examKeys.tests(query),
    queryFn: async (): Promise<TestListItem[]> =>
      (
        await get<TestListItem[]>('/exams', {
          kind: 'TEST',
          classId: query.classId || undefined,
          subjectId: query.subjectId || undefined,
        })
      ).data,
    placeholderData: keepPreviousData,
  })
}

/** Multi-subject exams with their subject schedule — `GET /exams?kind=EXAM`. */
export function useExams(query: ExamListQuery = {}) {
  return useQuery({
    queryKey: examKeys.exams(query),
    queryFn: async (): Promise<ExamListItem[]> =>
      (
        await get<ExamListItem[]>('/exams', {
          kind: 'EXAM',
          classId: query.classId || undefined,
          type: query.type || undefined,
        })
      ).data,
    placeholderData: keepPreviousData,
  })
}

/** The whole marks sheet for one exam — every subject, the roster and the entries so far. */
export function useResultSheet(examId: string | null) {
  return useQuery({
    queryKey: examKeys.results(examId ?? ''),
    queryFn: async (): Promise<ResultSheet> => (await get<ResultSheet>(`/exams/${examId}/results`)).data,
    enabled: examId !== null,
  })
}

/** Every write invalidates the module, so the lists and the sheet agree afterwards. */
function useExamMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examKeys.all }),
  })
}

export function useCreateTest() {
  return useExamMutation(
    async (input: TestInput) => (await post<TestListItem>('/exams', { ...input, kind: 'TEST' })).data,
  )
}

export function useUpdateTest() {
  return useExamMutation(
    async ({ id, input }: { id: string; input: TestInput }) => (await patch<TestListItem>(`/exams/${id}`, input)).data,
  )
}

export function useCreateExam() {
  return useExamMutation(
    async (input: ExamInput) => (await post<ExamListItem>('/exams', { ...input, kind: 'EXAM' })).data,
  )
}

export function useUpdateExam() {
  return useExamMutation(
    async ({ id, input }: { id: string; input: ExamInput }) => (await patch<ExamListItem>(`/exams/${id}`, input)).data,
  )
}

export function useDeleteExam() {
  return useExamMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/exams/${id}`)).data)
}

/** Save All — the sheet's changed cells, upserted on `(exam, student, subject)`. */
export function useSaveMarks() {
  return useExamMutation(
    async ({ examId, entries }: { examId: string; entries: ResultEntryInput[] }) =>
      (await post<ResultSheet>(`/exams/${examId}/marks`, { entries })).data,
  )
}

/** Publish All / Unpublish All — one flag on the exam, not per row. */
export function usePublishExam() {
  return useExamMutation(
    async ({ examId, publish }: { examId: string; publish: boolean }) =>
      (await post<ResultSheet>(`/exams/${examId}/${publish ? 'publish' : 'unpublish'}`, {})).data,
  )
}
