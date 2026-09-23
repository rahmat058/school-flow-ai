export type RecordStatus = 'ACTIVE' | 'INACTIVE'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type ParentRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN'

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
  status: RecordStatus
}

export interface Parent {
  id: string
  schoolId: string
  userId: string
  firstName: string
  lastName: string
  phone: string | null
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

/** Read model for the admin students table — the entity plus its joined class/guardian. */
export interface StudentListItem extends Student {
  className: string
  guardianName: string | null
}
