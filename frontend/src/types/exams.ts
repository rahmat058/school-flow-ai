export type ExamType = 'UNIT' | 'MID' | 'FINAL'

export interface Exam {
  id: string
  schoolId: string
  classId: string
  name: string
  type: ExamType
  startDate: string
  endDate: string
  isPublished: boolean
  publishedAt: string | null
}

export interface ExamSubject {
  id: string
  schoolId: string
  examId: string
  subjectId: string
  examDate: string
  maxMarks: number
  passMarks: number | null
}

export interface ExamResult {
  id: string
  schoolId: string
  examId: string
  studentId: string
  subjectId: string
  obtainedMarks: number
  isAbsent: boolean
  enteredById: string | null
}

export interface ReportCard {
  id: string
  schoolId: string
  examId: string
  studentId: string
  totalMarks: number
  obtainedMarks: number
  /** 0–100, two decimals. */
  percentage: number
  grade: string
  rank: number | null
  aiComment: string | null
  publishedAt: string | null
}
