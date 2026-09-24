export type MaterialType = 'PDF' | 'NOTES' | 'WORKSHEET' | 'PAPER'

/** Derived from `dueDate` against today — the schema has no status column. Overdue wins. */
export type HomeworkStatus = 'ACTIVE' | 'OVERDUE'

export interface Homework {
  id: string
  schoolId: string
  classId: string
  subjectId: string
  teacherId: string
  title: string
  description: string | null
  /** ISO date — the late-submission boundary. */
  dueDate: string
  /** Optional ceiling a graded submission is scored against. */
  maxMarks: number | null
  attachments: string[]
  /** Soft delete (`Database.md` §6): the row survives so submissions keep their parent. */
  deletedAt: string | null
}

/**
 * Read model for the homework grid — the assignment plus its joined class, subject and author, the
 * submission roll-up and the derived status. Computed in the API layer (or the mock adapter standing
 * in for it), never in the view.
 */
export interface HomeworkListItem {
  id: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  title: string
  description: string | null
  dueDate: string
  maxMarks: number | null
  attachments: string[]
  /** Submissions received so far. */
  submittedCount: number
  /** Students on the class roster the assignment counts against. */
  totalStudents: number
  status: HomeworkStatus
}

/** What the assignment form sends. Author, school and attachments are the server's job. */
export interface HomeworkInput {
  classId: string
  subjectId: string
  title: string
  description: string | null
  dueDate: string
  maxMarks: number | null
}

export interface HomeworkSubmission {
  id: string
  schoolId: string
  homeworkId: string
  studentId: string
  files: string[]
  submittedAt: string
  isLate: boolean
  grade: string | null
  remarks: string | null
  gradedById: string | null
  gradedAt: string | null
}

export interface StudyMaterial {
  id: string
  schoolId: string
  classId: string
  subjectId: string
  uploadedById: string
  title: string
  description: string | null
  type: MaterialType
  fileUrl: string
  fileSizeBytes: number | null
  createdAt: string
}
