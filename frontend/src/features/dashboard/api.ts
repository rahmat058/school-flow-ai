import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { DashboardSummary, StudentDashboard } from '@/types/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: () => [...dashboardKeys.all, 'admin'] as const,
  student: () => [...dashboardKeys.all, 'student'] as const,
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
