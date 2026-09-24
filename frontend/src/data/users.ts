import type { AuthUser, Role } from '@/types/auth'
import { DEMO_PASSWORD, SCHOOL_DOMAIN, SCHOOL_ID, personName, schoolEmail } from '@/data/seed'
import { classIds } from '@/data/classes'

/** Teacher profile indexes (`tch_1`…`tch_8`) — kept in sync with `data/teachers.ts`. */
const TEACHER_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8]
/** Parent profile indexes (`par_1`…`par_12`) — kept in sync with `data/parents.ts`. */
const PARENT_INDEXES = Array.from({ length: 12 }, (_, index) => index + 1)
/** Student profile indexes (`std_1`…`std_24`) — kept in sync with `data/students.ts`. */
const STUDENT_INDEXES = Array.from({ length: 24 }, (_, index) => index + 1)

function teacherUser(index: number): AuthUser {
  const { firstName, lastName } = personName(index)
  return {
    id: `usr_tch_${index}`,
    email: schoolEmail(index, SCHOOL_DOMAIN),
    role: 'TEACHER',
    schoolId: SCHOOL_ID,
    isVerified: true,
    profileId: `tch_${index}`,
    firstName,
    lastName,
    classId: null,
  }
}

function parentUser(index: number): AuthUser {
  const { firstName, lastName } = personName(index)
  return {
    id: `usr_par_${index}`,
    email: schoolEmail(index, 'parent.' + SCHOOL_DOMAIN),
    role: 'PARENT',
    schoolId: SCHOOL_ID,
    isVerified: true,
    profileId: `par_${index}`,
    firstName,
    lastName,
    classId: null,
  }
}

function studentUser(index: number): AuthUser {
  const { firstName, lastName } = personName(index)
  return {
    id: `usr_std_${index}`,
    email: schoolEmail(index, 'student.' + SCHOOL_DOMAIN),
    role: 'STUDENT',
    schoolId: SCHOOL_ID,
    isVerified: true,
    profileId: `std_${index}`,
    firstName,
    lastName,
    // The same distribution `data/students.ts` uses, read from the one list in `data/classes.ts`.
    classId: classIds[(index - 1) % classIds.length],
  }
}

const adminUser: AuthUser = {
  id: 'usr_admin_1',
  email: 'admin@brightfuture.edu',
  role: 'ADMIN',
  schoolId: SCHOOL_ID,
  isVerified: true,
  profileId: null,
  firstName: 'Nadia',
  lastName: 'Rahman',
  classId: null,
}

/** Every account in the demo school. */
export const users: AuthUser[] = [
  adminUser,
  ...TEACHER_INDEXES.map(teacherUser),
  ...STUDENT_INDEXES.map(studentUser),
  ...PARENT_INDEXES.map(parentUser),
]

export interface DemoAccount {
  role: Role
  label: string
  email: string
  /** Demo-only. Real credentials are bcrypt hashes the API never returns. */
  password: string
  userId: string
}

/** Surfaced in the login screen so the demo can be explored without a backend. */
export const demoAccounts: DemoAccount[] = [
  { role: 'ADMIN', label: 'School admin', email: adminUser.email, password: DEMO_PASSWORD, userId: adminUser.id },
  {
    role: 'TEACHER',
    label: 'Class teacher',
    email: 'ayesha.khan1@brightfuture.edu',
    password: DEMO_PASSWORD,
    userId: 'usr_tch_1',
  },
  {
    role: 'STUDENT',
    label: 'Class 1-A student',
    email: 'ayesha.khan1@student.brightfuture.edu',
    password: DEMO_PASSWORD,
    userId: 'usr_std_1',
  },
  {
    role: 'PARENT',
    label: 'Parent of two',
    email: 'ayesha.khan1@parent.brightfuture.edu',
    password: DEMO_PASSWORD,
    userId: 'usr_par_1',
  },
]

export function findUserByEmail(email: string): AuthUser | undefined {
  return users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase())
}

export function findUserById(id: string): AuthUser | undefined {
  return users.find((user) => user.id === id)
}
