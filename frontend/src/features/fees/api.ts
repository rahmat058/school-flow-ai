import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post, remove } from '@/services/apiClient'
import type { Paginated } from '@/types/api'
import type {
  ClassFeeStatusRow,
  ClassReportRow,
  ConcessionInput,
  ConcessionRow,
  DayBook,
  DefaulterRow,
  FeeCollectSummary,
  FeeCollectionSummary,
  FeeDashboard,
  FeeHead,
  FeeHeadInput,
  FeeStructureDetail,
  InvoiceInput,
  InvoiceStatus,
  PendingInvoiceRow,
  PaymentInput,
  Receipt,
  StudentCollectSummary,
  StudentFeesOverview,
  StudentLedger,
  StudentPaymentInput,
} from '@/types/fees'
import type { StudentListItem } from '@/types/people'

export interface FeeCollectQuery {
  classId?: string
  status?: InvoiceStatus | ''
}

export interface FeeCollectStudentsQuery extends FeeCollectQuery {
  page: number
  limit: number
}

export interface PendingInvoiceQuery {
  page: number
  limit: number
}

export interface StudentOption {
  value: string
  label: string
  classId: string
}

export const feeKeys = {
  all: ['fees'] as const,
  summary: () => [...feeKeys.all, 'summary'] as const,
  dashboard: () => [...feeKeys.all, 'dashboard'] as const,
  pending: (query: PendingInvoiceQuery) => [...feeKeys.all, 'pending', query] as const,
  structures: (classId: string) => [...feeKeys.all, 'structures', classId] as const,
  collectSummary: (query: FeeCollectQuery) => [...feeKeys.all, 'collect-summary', query] as const,
  collectStudents: (query: FeeCollectStudentsQuery) => [...feeKeys.all, 'collect-students', query] as const,
  studentCollect: (studentId: string) => [...feeKeys.all, 'collect-student', studentId] as const,
  /** The caller's own fees, resolved from the session — no id in the key. */
  me: () => [...feeKeys.all, 'me'] as const,
  receipt: (paymentId: string) => [...feeKeys.all, 'receipt', paymentId] as const,
  dayBook: (date: string) => [...feeKeys.all, 'day-book', date] as const,
  classReport: (classId: string) => [...feeKeys.all, 'class-report', classId] as const,
  defaulters: (classId: string) => [...feeKeys.all, 'defaulters', classId] as const,
  ledger: (studentId: string) => [...feeKeys.all, 'ledger', studentId] as const,
  concessions: () => [...feeKeys.all, 'concessions'] as const,
  studentOptions: () => [...feeKeys.all, 'student-options'] as const,
}

/** Every write invalidates the fees domain, so the dashboard, tables and totals refresh together. */
function useFeeMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.all }),
  })
}

export function useFeeSummary() {
  return useQuery({
    queryKey: feeKeys.summary(),
    queryFn: async () => (await get<FeeCollectionSummary>('/fees/summary')).data,
  })
}

export function useFeeDashboard() {
  return useQuery({
    queryKey: feeKeys.dashboard(),
    queryFn: async () => (await get<FeeDashboard>('/fees/dashboard')).data,
  })
}

export function usePendingInvoices(query: PendingInvoiceQuery) {
  return useQuery({
    queryKey: feeKeys.pending(query),
    queryFn: async (): Promise<Paginated<PendingInvoiceRow>> => {
      const { data, meta } = await get<PendingInvoiceRow[]>('/fees/pending', {
        page: query.page,
        limit: query.limit,
      })

      return { items: data, meta: meta ?? { page: query.page, limit: query.limit, total: data.length } }
    },
    placeholderData: keepPreviousData,
  })
}

/** An empty `classId` asks for every structure — what the concession form's head picker needs. */
export function useFeeStructures(classId = '') {
  return useQuery({
    queryKey: feeKeys.structures(classId),
    queryFn: async (): Promise<FeeStructureDetail[]> =>
      (await get<FeeStructureDetail[]>('/fees/structures', classId ? { classId } : undefined)).data,
  })
}

export function useCollectSummary(query: FeeCollectQuery) {
  return useQuery({
    queryKey: feeKeys.collectSummary(query),
    queryFn: async (): Promise<FeeCollectSummary> =>
      (
        await get<FeeCollectSummary>('/fees/collect/summary', {
          classId: query.classId || undefined,
          status: query.status || undefined,
        })
      ).data,
  })
}

export function useCollectStudents(query: FeeCollectStudentsQuery) {
  return useQuery({
    queryKey: feeKeys.collectStudents(query),
    queryFn: async (): Promise<Paginated<ClassFeeStatusRow>> => {
      const { data, meta } = await get<ClassFeeStatusRow[]>('/fees/collect/students', {
        page: query.page,
        limit: query.limit,
        classId: query.classId || undefined,
        status: query.status || undefined,
      })

      return { items: data, meta: meta ?? { page: query.page, limit: query.limit, total: data.length } }
    },
    placeholderData: keepPreviousData,
  })
}

export function useStudentCollect(studentId: string) {
  return useQuery({
    queryKey: feeKeys.studentCollect(studentId),
    queryFn: async () => (await get<StudentCollectSummary>(`/fees/collect/student/${studentId}`)).data,
    enabled: studentId.length > 0,
  })
}

/** The caller's own fees — `GET /fees/me`, self-scoped by the session. */
export function useMyFees() {
  return useQuery({
    queryKey: feeKeys.me(),
    queryFn: async () => (await get<StudentFeesOverview>('/fees/me')).data,
  })
}

export function useReceipt(paymentId: string) {
  return useQuery({
    queryKey: feeKeys.receipt(paymentId),
    queryFn: async () => (await get<Receipt>(`/fees/payments/${paymentId}/receipt`)).data,
    enabled: paymentId.length > 0,
  })
}

export function useCreateInvoice() {
  return useFeeMutation(
    async (input: InvoiceInput) => (await post<StudentCollectSummary>('/fees/invoices', input)).data,
  )
}

export function useRecordPayment() {
  return useFeeMutation(async (input: PaymentInput) => (await post<Receipt>('/fees/payments/manual', input)).data)
}

/** Pays one of the caller's own invoices — `POST /fees/me/payments`. */
export function usePayMyInvoice() {
  return useFeeMutation(async (input: StudentPaymentInput) => (await post<Receipt>('/fees/me/payments', input)).data)
}

export function useCreateFeeHead() {
  return useFeeMutation(async (input: FeeHeadInput) => (await post<FeeStructureDetail>('/fees/heads', input)).data)
}

export function useUpdateFeeHead() {
  return useFeeMutation(
    async ({ id, input }: { id: string; input: FeeHeadInput }) =>
      (await patch<FeeHead>(`/fees/heads/${id}`, input)).data,
  )
}

export function useDeleteFeeHead() {
  return useFeeMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/fees/heads/${id}`)).data)
}

export function useDayBook(date: string) {
  return useQuery({
    queryKey: feeKeys.dayBook(date),
    queryFn: async () => (await get<DayBook>('/fees/reports/day-book', date ? { date } : undefined)).data,
  })
}

export function useClassReport(classId: string) {
  return useQuery({
    queryKey: feeKeys.classReport(classId),
    queryFn: async () => (await get<ClassReportRow[]>('/fees/reports/class', { classId })).data,
    enabled: classId.length > 0,
  })
}

export function useDefaulters(classId: string) {
  return useQuery({
    queryKey: feeKeys.defaulters(classId),
    queryFn: async () =>
      (await get<DefaulterRow[]>('/fees/reports/defaulters', classId ? { classId } : undefined)).data,
  })
}

export function useStudentLedger(studentId: string) {
  return useQuery({
    queryKey: feeKeys.ledger(studentId),
    queryFn: async () => (await get<StudentLedger>('/fees/reports/student-ledger', { studentId })).data,
    enabled: studentId.length > 0,
  })
}

export function useConcessions() {
  return useQuery({
    queryKey: feeKeys.concessions(),
    queryFn: async () => (await get<ConcessionRow[]>('/fees/concessions')).data,
  })
}

export function useCreateConcession() {
  return useFeeMutation(async (input: ConcessionInput) => (await post<ConcessionRow>('/fees/concessions', input)).data)
}

export function useUpdateConcession() {
  return useFeeMutation(
    async ({ id, input }: { id: string; input: ConcessionInput }) =>
      (await patch<ConcessionRow>(`/fees/concessions/${id}`, input)).data,
  )
}

export function useDeleteConcession() {
  return useFeeMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/fees/concessions/${id}`)).data)
}

/** Every student as a select/combobox option, for the collect search and the report pickers. */
export function useStudentOptions() {
  return useQuery({
    queryKey: feeKeys.studentOptions(),
    queryFn: async (): Promise<StudentOption[]> => {
      const { data } = await get<StudentListItem[]>('/students', { limit: 200 })

      return data.map((student) => ({
        value: student.id,
        label: `${student.firstName} ${student.lastName} (${student.className})`,
        classId: student.classId ?? '',
      }))
    },
    staleTime: 5 * 60_000,
  })
}
