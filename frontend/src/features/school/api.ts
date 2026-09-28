import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/services/apiClient'
import { useCurrentUser } from '@/store/auth'
import type { BackupJob, School, SchoolProfileInput, SchoolSettingsInput } from '@/types/school'

export const schoolKeys = {
  all: ['school'] as const,
  detail: (id: string) => [...schoolKeys.all, id] as const,
}

/** The signed-in user's school — profile columns plus the `settings` document the tabs edit. */
export function useCurrentSchool() {
  const schoolId = useCurrentUser()?.schoolId

  return useQuery({
    queryKey: schoolKeys.detail(schoolId ?? ''),
    queryFn: async () => (await get<School>(`/schools/${schoolId}`)).data,
    enabled: Boolean(schoolId),
    staleTime: 10 * 60_000,
  })
}

/** The School Profile tab: writes the school's own columns, not `settings`. */
export function useUpdateSchoolProfile() {
  const queryClient = useQueryClient()
  const schoolId = useCurrentUser()?.schoolId

  return useMutation({
    mutationFn: async (input: SchoolProfileInput) => (await patch<School>(`/schools/${schoolId}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: schoolKeys.all }),
  })
}

/** The Academic, Notifications and Security tabs: each sends only its own slice of `settings`. */
export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient()
  const schoolId = useCurrentUser()?.schoolId

  return useMutation({
    mutationFn: async (input: SchoolSettingsInput) =>
      (await patch<School>(`/schools/${schoolId}/settings`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: schoolKeys.all }),
  })
}

/** The Security tab's "Create Backup". */
export function useCreateBackup() {
  const schoolId = useCurrentUser()?.schoolId

  return useMutation({
    mutationFn: async () => (await post<BackupJob>(`/schools/${schoolId}/backup`)).data,
  })
}
