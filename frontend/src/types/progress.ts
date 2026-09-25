import type { StatMetric } from '@/types/dashboard'
import type { ExamType } from '@/types/exams'

/** One published assessment's share — a point on the performance trend, oldest first. */
export interface ProgressTrendPoint {
  /** The assessment's name, e.g. "Mid Term Examination". */
  label: string
  examType: ExamType
  /** ISO date (`YYYY-MM-DD`) the window opened. */
  date: string
  /** The student's obtained marks over the papers' total, 0–100. */
  percentage: number
}

/** One subject, the student against their class — a radar spoke and a Subject-wise row. */
export interface ProgressSubjectRow {
  subjectId: string
  subjectName: string
  subjectCode: string
  /** The student's own mean across published papers, 0–100. */
  studentPercentage: number
  /** The class's mean in the same subject, 0–100 — every classmate weighted equally. */
  classPercentage: number
  grade: string
  /** How many published papers back the figures. */
  papers: number
}

/** One teacher's note beside a published mark — the Teacher remarks tab's row. */
export interface ProgressRemarkRow {
  id: string
  subjectName: string
  teacherName: string
  examName: string
  /** ISO date (`YYYY-MM-DD`) the paper was sat. */
  date: string
  remark: string
  marks: number
  total: number
  grade: string
}

/** The headline figures behind the stat cards. */
export interface ProgressSummary {
  /** 10-point scale at `percentage ÷ 10`, so 71% reads 7.10. */
  gpa: number
  /** Position in the class by the latest published report card; `null` until one exists. */
  rank: number | null
  classSize: number
  /** How many subjects the student's class runs. */
  subjects: number
  /** Mean of the student's published percentages, 0–100. */
  averageScore: number
}

/**
 * `GET /progress/me` — the caller's own academic progress in one payload. Self-scoped: the student
 * comes from the session, no id appears in the path, and every figure is derived from their own
 * published marks, so this screen and the marks sheet cannot disagree.
 */
export interface StudentProgress {
  /** Overall GPA, class rank, subject count and average score, display-ready. */
  stats: StatMetric[]
  summary: ProgressSummary
  /** Published assessments, oldest first. */
  trend: ProgressTrendPoint[]
  /** Every subject the class runs, strongest student average first. */
  subjects: ProgressSubjectRow[]
  /** Teacher notes, newest first. */
  remarks: ProgressRemarkRow[]
}
