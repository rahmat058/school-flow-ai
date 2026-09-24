import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, put } from '@/services/apiClient'
import type { PermissionGroupRow, StaffPermissionRow, UserPermissions, UserPermissionsInput } from '@/types/permission'

export const permissionKeys = {
  all: ['permissions'] as const,
  catalogue: () => [...permissionKeys.all, 'catalogue'] as const,
  staff: () => [...permissionKeys.all, 'staff'] as const,
  forUser: (userId: string) => [...permissionKeys.all, 'user', userId] as const,
}

/** The assignable catalogue, grouped and ordered — `GET /permissions`. */
export function usePermissionCatalogue() {
  return useQuery({
    queryKey: permissionKeys.catalogue(),
    queryFn: async (): Promise<PermissionGroupRow[]> => (await get<PermissionGroupRow[]>('/permissions')).data,
    staleTime: 5 * 60_000,
  })
}

/** The staff picker, each row carrying its grant count — `GET /permissions/staff`. */
export function useStaffPermissions() {
  return useQuery({
    queryKey: permissionKeys.staff(),
    queryFn: async (): Promise<StaffPermissionRow[]> => (await get<StaffPermissionRow[]>('/permissions/staff')).data,
    staleTime: 60_000,
  })
}

/** One account's grants — `GET /users/:userId/permissions`. */
export function useUserPermissions(userId: string | null) {
  return useQuery({
    queryKey: permissionKeys.forUser(userId ?? ''),
    queryFn: async (): Promise<UserPermissions> => (await get<UserPermissions>(`/users/${userId}/permissions`)).data,
    enabled: userId !== null,
  })
}

/** Replaces the whole grant set, then re-reads the picker counts and this user's row. */
export function useSaveUserPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, input }: { userId: string; input: UserPermissionsInput }) =>
      (await put<UserPermissions>(`/users/${userId}/permissions`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionKeys.all }),
  })
}
