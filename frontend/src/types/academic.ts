/** Named `ClassRoom` because `Class` is a reserved word in JS/TS. */
export interface ClassRoom {
  id: string
  schoolId: string
  grade: number
  section: string
  academicYear: string
  classTeacherId: string | null
}

export interface Subject {
  id: string
  schoolId: string
  classId: string
  name: string
  code: string
  teacherId: string | null
}

/** Read model for dropdowns: class with its display label already resolved. */
export interface ClassOption {
  id: string
  label: string
  grade: number
  section: string
}
