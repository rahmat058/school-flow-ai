export type RecordStatus = 'ACTIVE' | 'INACTIVE'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type ParentRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN'
export type FeeStanding = 'PAID' | 'PENDING'

export interface Teacher {
  id: string
  schoolId: string
  userId: string
  employeeNo: string
  firstName: string
  lastName: string
  phone: string | null
  qualification: string | null
  /** ISO date (`YYYY-MM-DD`). */
  joinedAt: string | null
  status: RecordStatus
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
  /** Current class — the roster. */
  classId: string | null
  /** Position within the class roster — the school's roll number. */
  rollNo: number
  status: RecordStatus
}

/** A student's primary guardian, flattened for the roster read model and the enrolment form. */
export interface Guardian {
  name: string
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
  classId: string
  rollNo: number | null
  dateOfBirth: string | null
  gender: Gender | null
  guardian: Guardian | null
}
