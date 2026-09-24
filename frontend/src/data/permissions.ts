import type { Permission, PermissionGroup, UserPermission } from '@/types/permission'
import { SCHOOL_ID, dateTimeOffset } from '@/data/seed'
import { users } from '@/data/users'

interface PermissionSeed {
  key: string
  group: PermissionGroup
  label: string
}

/** The catalogue the editor renders, in group then row order. Platform-wide, not per school. */
const CATALOGUE: PermissionSeed[] = [
  { key: 'students.view', group: 'STUDENTS', label: 'View all students' },
  { key: 'students.create', group: 'STUDENTS', label: 'Create student' },
  { key: 'students.edit', group: 'STUDENTS', label: 'Edit student' },
  { key: 'students.delete', group: 'STUDENTS', label: 'Delete student' },
  { key: 'attendance.view', group: 'ATTENDANCE', label: 'View attendance' },
  { key: 'attendance.mark', group: 'ATTENDANCE', label: 'Mark attendance' },
  { key: 'exams.view', group: 'EXAMS', label: 'View exams' },
  { key: 'exams.create', group: 'EXAMS', label: 'Create exam' },
  { key: 'exams.marks', group: 'EXAMS', label: 'Enter marks' },
  { key: 'homework.view', group: 'HOMEWORK', label: 'View homework' },
  { key: 'homework.assign', group: 'HOMEWORK', label: 'Assign homework' },
  { key: 'timetable.view', group: 'TIMETABLE', label: 'View timetable' },
  { key: 'timetable.manage', group: 'TIMETABLE', label: 'Manage timetable' },
  { key: 'fees.view', group: 'FEES', label: 'View fees' },
  { key: 'fees.manage', group: 'FEES', label: 'Manage fees' },
  { key: 'notices.view', group: 'NOTICES', label: 'View notices' },
  { key: 'notices.post', group: 'NOTICES', label: 'Post notices' },
  { key: 'materials.view', group: 'MATERIALS', label: 'View study materials' },
  { key: 'materials.upload', group: 'MATERIALS', label: 'Upload study materials' },
  { key: 'chat.view', group: 'COMMUNICATION', label: 'View conversations' },
  { key: 'chat.send', group: 'COMMUNICATION', label: 'Send messages' },
  { key: 'reports.view', group: 'REPORTS', label: 'View reports' },
  { key: 'reports.export', group: 'REPORTS', label: 'Export reports' },
]

const groupOrder = new Map<PermissionGroup, number>()

export const permissions: Permission[] = CATALOGUE.map((seed, index) => {
  const sortOrder = groupOrder.get(seed.group) ?? 0
  groupOrder.set(seed.group, sortOrder + 1)

  return { id: `prm_${index + 1}`, key: seed.key, group: seed.group, label: seed.label, sortOrder }
})

const permissionIdByKey = new Map(permissions.map((permission) => [permission.key, permission.id]))

/** A teacher's starting set — the role defaults from `PRD.md` §2. */
const TEACHER_DEFAULTS = [
  'students.view',
  'attendance.view',
  'attendance.mark',
  'exams.view',
  'exams.create',
  'exams.marks',
  'homework.view',
  'homework.assign',
  'timetable.view',
  'materials.view',
  'materials.upload',
  'notices.view',
  'reports.view',
]

/** Deterministic spread, so a few teachers hold grants beyond the role default. */
function extraKeysFor(index: number): string[] {
  const extra: string[] = []
  if (index % 3 === 0) extra.push('notices.post')
  if (index % 4 === 0) extra.push('students.create', 'students.edit')
  if (index % 5 === 0) extra.push('fees.view')

  return extra
}

export const userPermissions: UserPermission[] = users
  .filter((user) => user.role === 'TEACHER')
  .flatMap((user, offset) =>
    [...TEACHER_DEFAULTS, ...extraKeysFor(offset + 1)].flatMap((key) => {
      const permissionId = permissionIdByKey.get(key)
      if (!permissionId) return []

      return [
        {
          id: `upm_${user.id}_${permissionId}`,
          schoolId: SCHOOL_ID,
          userId: user.id,
          permissionId,
          grantedById: 'usr_admin_1',
          createdAt: dateTimeOffset(-30 + offset, 9, 0),
        },
      ]
    }),
  )
