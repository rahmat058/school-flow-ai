import type { InvoiceStatus } from '@/types/fees'

export type RecordStatus = 'ACTIVE' | 'INACTIVE'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type ParentRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN'
/** The roster's fee column: overdue wins, then anything still owing, otherwise settled. */
export type FeeStanding = 'PAID' | 'UNPAID' | 'OVERDUE'

export interface Teacher {
  id: string
  schoolId: string
  userId: string
  employeeNo: string
  firstName: string
  lastName: string
  phone: string | null
  qualification: string | null
  /** The subject they primarily teach — their profile, not a class assignment. */
  subject: string | null
  /** Whole years of teaching experience. */
  experienceYears: number | null
  /** ISO date (`YYYY-MM-DD`). */
  joinedAt: string | null
  status: RecordStatus
}

/** Read model for the teachers grid — the profile plus its login email and assigned classes. */
export interface TeacherListItem extends Teacher {
  email: string
  classIds: string[]
  classLabels: string[]
}

/** What the teacher form sends. Employee number and credentials are the server's job. */
export interface TeacherInput {
  fullName: string
  subject: string
  email: string
  phone: string | null
  qualification: string | null
  experienceYears: number | null
  classIds: string[]
}

/** One class a teacher is assigned to — the `teacher_classes` join. */
export interface TeacherClass {
  teacherId: string
  classId: string
}

/**
 * A student a caller may read a personal slice for: a guardian's own children, or a student's single
 * entry. Every `me` route that a guardian may point at a child (`/attendance/me`, `/exams/me`,
 * `/fees/me`) returns this list, so one shape serves them all.
 */
export interface StudentSubject {
  id: string
  label: string
  /** The student's class label, e.g. `1-A`. */
  meta: string
}

export interface Student {
  id: string
  schoolId: string
  userId: string
  admissionNo: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  gender: Gender | null
  bloodGroup: BloodGroup | null
  /** Current class — the roster. */
  classId: string | null
  /** Position within the class roster — the school's roll number. */
  rollNo: number
  status: RecordStatus
}

/** A student's primary guardian, flattened for the roster read model and the enrolment form. */
export interface Guardian {
  name: string
  /** How the guardian is related — from `parent_students.relation`. Optional on the way in. */
  relation?: ParentRelation | null
  email: string | null
  phone: string | null
  address: string | null
}

export interface Parent {
  id: string
  schoolId: string
  userId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  occupation: string | null
  status: RecordStatus
}

export interface ParentStudentLink {
  id: string
  schoolId: string
  parentId: string
  studentId: string
  relation: ParentRelation
  isPrimary: boolean
}

/** Read model for the admin students table — the entity plus its joined class, guardian and roll-ups. */
export interface StudentListItem extends Student {
  className: string
  /** The student's login address (`users.email`), which the enrolment form collects. */
  email: string
  /** The primary guardian, with the contact details the enrolment form collects. */
  guardian: Guardian | null
  /** Share of register days the student was present or late, 0–100. */
  attendancePercentage: number
  /** PAID when the student has nothing outstanding across their invoices. */
  feeStanding: FeeStanding
}

/** What the create/update form sends. Admission number and credentials are the server's job. */
export interface StudentInput {
  firstName: string
  lastName: string
  /** The student's own login address — one of the two accounts an enrolment creates. */
  email: string
  classId: string
  rollNo: number | null
  dateOfBirth: string | null
  gender: Gender | null
  bloodGroup: BloodGroup | null
  guardian: Guardian | null
}

/** The invite that goes out with a new account: a login plus a verification link. */
export interface AccountInvite {
  email: string
  verificationRequired: boolean
  /** Mock only — a real API emails the password and never returns it. */
  mockOnlyPassword?: string
}

/** The create response: the new roster row, plus the invite that was sent to the student. */
export type StudentCreated = StudentListItem & { invite?: AccountInvite }

/** The create response for a teacher: the grid row plus the invite that went out. */
export type TeacherCreated = TeacherListItem & { invite?: AccountInvite }

/** Everything the profile header and Overview tab read, in one payload. */
export interface StudentProfile extends StudentListItem {
  /** Homeroom teacher of the current class. */
  classTeacherName: string | null
  /** Consecutive present days ending on the most recent register day. */
  streakDays: number
  daysPresent: number
  daysAbsent: number
}

/** One month of the register, for the Attendance tab. */
export interface AttendanceMonth {
  /** e.g. "August 2026". */
  month: string
  present: number
  absent: number
  late: number
  total: number
  rate: number
}

export interface StudentAttendance {
  totals: { total: number; present: number; absent: number; late: number; rate: number }
  months: AttendanceMonth[]
}

/** One subject paper — the Marks tab's row and the Results tab's row are the same record. */
export interface StudentMarkRow {
  id: string
  examName: string
  examType: string
  subjectName: string
  date: string
  marks: number
  total: number
  percentage: number
  grade: string
  result: 'PASS' | 'FAIL'
  isPublished: boolean
}

export interface StudentResults {
  summary: { passed: number; failed: number; average: number }
  rows: StudentMarkRow[]
}

/** One invoice, flattened for the Fee history tab. */
export interface StudentFeeRow {
  id: string
  title: string
  amountPaise: number
  paidPaise: number
  paidAt: string | null
  method: string | null
  status: InvoiceStatus
}

export interface StudentFees {
  summary: { paidPaise: number; duePaise: number; totalPaise: number }
  rows: StudentFeeRow[]
}

/** A file held against a student. No rows yet — the tab renders its empty state from this. */
export interface StudentDocument {
  id: string
  title: string
  kind: string
  sizeKb: number
  uploadedAt: string
}
