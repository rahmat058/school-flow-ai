import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type {
  AttendanceReport,
  ExamPaperOption,
  ExamResultsReport,
  FinanceReport,
  ReportsOverview,
} from '@/types/reports'

export interface AttendanceReportQuery {
  month: number
  year: number
  classId?: string
}

export const reportKeys = {
  all: ['reports'] as const,
  overview: () => [...reportKeys.all, 'overview'] as const,
  attendance: (query: AttendanceReportQuery) => [...reportKeys.all, 'attendance', query] as const,
  examPapers: () => [...reportKeys.all, 'exam-papers'] as const,
  examResults: (paperId: string) => [...reportKeys.all, 'exam-results', paperId] as const,
  finance: () => [...reportKeys.all, 'finance'] as const,
}

/** `GET /reports/overview` — school-wide counts, the twelve-month fee picture and the classes. */
export function useReportsOverview() {
  return useQuery({
    queryKey: reportKeys.overview(),
    queryFn: async (): Promise<ReportsOverview> => (await get<ReportsOverview>('/reports/overview')).data,
  })
}

/** `GET /reports/attendance` — the register for one month, optionally narrowed to a class. */
export function useAttendanceReport(query: AttendanceReportQuery) {
  return useQuery({
    queryKey: reportKeys.attendance(query),
    queryFn: async (): Promise<AttendanceReport> =>
      (
        await get<AttendanceReport>('/reports/attendance', {
          month: query.month,
          year: query.year,
          classId: query.classId || undefined,
        })
      ).data,
    placeholderData: keepPreviousData,
  })
}

/** The papers that can be reported on — `GET /reports/exam-results/papers`. */
export function useExamPaperOptions() {
  return useQuery({
    queryKey: reportKeys.examPapers(),
    queryFn: async (): Promise<ExamPaperOption[]> =>
      (await get<ExamPaperOption[]>('/reports/exam-results/papers')).data,
    staleTime: 5 * 60_000,
  })
}

/** `GET /reports/exam-results?paperId=` — one paper's marks, distribution and outcomes. */
export function useExamResultsReport(paperId: string) {
  return useQuery({
    queryKey: reportKeys.examResults(paperId),
    queryFn: async (): Promise<ExamResultsReport> =>
      (await get<ExamResultsReport>('/reports/exam-results', { paperId })).data,
    enabled: paperId.length > 0,
  })
}

/** `GET /reports/finance` — collection totals, the twelve-month picture and the pending register. */
export function useFinanceReport() {
  return useQuery({
    queryKey: reportKeys.finance(),
    queryFn: async (): Promise<FinanceReport> => (await get<FinanceReport>('/reports/finance')).data,
  })
}
