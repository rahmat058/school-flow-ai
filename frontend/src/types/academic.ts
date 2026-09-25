/** Named `ClassRoom` because `Class` is a reserved word in JS/TS. */
export interface ClassRoom {
  id: string
  schoolId: string
  grade: number
  section: string
  academicYear: string
  classTeacherId: string | null
}

/** Read model for dropdowns: class with its display label already resolved. */
export interface ClassOption {
  id: string
  label: string
  grade: number
  section: string
}

/**
 * A subject **in the school's catalogue** — school-wide, not a per-class copy. Name and code are the
 * school's own (they are edited in the Subjects tab), so neither is an enum.
 */
export interface Subject {
  id: string
  schoolId: string
  name: string
  code: string
  description: string | null
}

/**
 * A subject offered by one class — the `class_subjects` assignment join. The teacher belongs here
 * rather than on the subject, because the same subject is taught by different staff in each class.
 */
export interface ClassSubject {
  id: string
  schoolId: string
  classId: string
  subjectId: string
  teacherId: string | null
}

/**
 * What the subject form sends. School and id are the server's job — and so is **assignment**: the
 * form only ever names and describes a subject, because which classes teach it belongs to the
 * assignment endpoints.
 */
export interface SubjectInput {
  name: string
  code: string
  description: string | null
}

/** A catalogue subject with its assignment count and the classes themselves — the Subjects tab's row. */
export interface SubjectRow extends Subject {
  classCount: number
  classIds: string[]
}

/** One class's assigned subjects — the Single Assignment panel's payload. */
export interface ClassAssignment {
  classId: string
  className: string
  subjects: Subject[]
}

/** The Summary tab: the class list, the subject list and the matrix between them. */
export interface AssignmentSummary {
  classes: ClassOption[]
  subjects: Subject[]
  /** `classId` → the ids of the subjects it offers. */
  assigned: Record<string, string[]>
}
