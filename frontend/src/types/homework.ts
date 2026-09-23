export type MaterialType = 'PDF' | 'NOTES' | 'WORKSHEET' | 'PAPER'

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
  attachments: string[]
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
