import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/services/apiClient'

/**
 * Server-state defaults for a dashboard app: cache briefly, never retry client errors, and do not
 * refetch just because the window regained focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 4xx will not succeed on retry — only retry server/network failures.
        if (error instanceof ApiError && error.status < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
