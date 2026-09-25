import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { DashboardSummary, ParentDashboard, StudentDashboard } from '@/types/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: () => [...dashboardKeys.all, 'admin'] as const,
  student: () => [...dashboardKeys.all, 'student'] as const,
  parent: (studentId: string) => [...dashboardKeys.all, 'parent', studentId] as const,
}

/** The school-wide overview an admin lands on. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: async () => (await get<DashboardSummary>('/dashboard/admin')).data,
  })
}

/** A student's own day — attendance, fees, today's periods and what is coming up. */
export function useStudentDashboard() {
  return useQuery({
    queryKey: dashboardKeys.student(),
    queryFn: async () => (await get<StudentDashboard>('/dashboard/student')).data,
  })
}

/**
 * A guardian's view of one of their children — `GET /dashboard/parent`. An empty id asks for the
 * first child, which is what the screen shows until one is picked; the response carries the whole
 * `children` list so the switcher needs no second read.
 */
export function useParentDashboard(studentId = '') {
  return useQuery({
    queryKey: dashboardKeys.parent(studentId),
    queryFn: async () => (await get<ParentDashboard>('/dashboard/parent', { studentId: studentId || undefined })).data,
  })
}
