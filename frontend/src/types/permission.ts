/** The permission catalogue's grouping — the editor's section headings (`Database.md` §2). */
export type PermissionGroup =
  | 'STUDENTS'
  | 'ATTENDANCE'
  | 'EXAMS'
  | 'HOMEWORK'
  | 'TIMETABLE'
  | 'FEES'
  | 'NOTICES'
  | 'MATERIALS'
  | 'COMMUNICATION'
  | 'REPORTS'

/** One assignable permission from the platform-wide catalogue. */
export interface Permission {
  id: string
  key: string
  group: PermissionGroup
  label: string
  sortOrder: number
}

/** The catalogue grouped for the editor — what `GET /permissions` returns. */
export interface PermissionGroupRow {
  group: PermissionGroup
  permissions: Permission[]
}

/** One row in the staff picker: the account plus how much it currently holds. */
export interface StaffPermissionRow {
  userId: string
  name: string
  email: string
  employeeNo: string
  grantedCount: number
  totalCount: number
}

/** One account's grants — loaded into the editor and saved back whole. */
export interface UserPermissions {
  userId: string
  name: string
  email: string
  employeeNo: string
  grantedKeys: string[]
  totalCount: number
}

/** The `PUT` body: the whole set, because the endpoint replaces it rather than merging. */
export interface UserPermissionsInput {
  keys: string[]
}

/** A grant row (`user_permissions`, `Database.md` §3) — the storage shape the mock mirrors. */
export interface UserPermission {
  id: string
  schoolId: string
  userId: string
  permissionId: string
  grantedById: string | null
  createdAt: string
}
