import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/services/apiClient'
import type { BackupJob, School, SchoolProfileInput, SchoolSettingsInput } from '@/types/school'

export const schoolKeys = {
  all: ['school'] as const,
  current: () => [...schoolKeys.all, 'current'] as const,
}

/** The signed-in user's school — profile columns plus the `settings` document the tabs edit. */
export function useCurrentSchool() {
  return useQuery({
    queryKey: schoolKeys.current(),
    queryFn: async () => (await get<School>('/schools/current')).data,
    staleTime: 10 * 60_000,
  })
}

/** The School Profile tab: writes the school's own columns, not `settings`. */
export function useUpdateSchoolProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SchoolProfileInput) => (await patch<School>('/schools/current', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: schoolKeys.all }),
  })
}

/** The Academic, Notifications and Security tabs: each sends only its own slice of `settings`. */
export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SchoolSettingsInput) => (await patch<School>('/schools/current/settings', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: schoolKeys.all }),
  })
}

/** The Security tab's "Create Backup". */
export function useCreateBackup() {
  return useMutation({
    mutationFn: async () => (await post<BackupJob>('/schools/current/backup')).data,
  })
}
