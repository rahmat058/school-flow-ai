import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { DashboardSummary } from '@/types/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: () => [...dashboardKeys.all, 'admin'] as const,
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: async () => (await get<DashboardSummary>('/dashboard/admin')).data,
  })
}
