import type { ExamStatus } from '@/types/exams'
import type { InvoiceStatus } from '@/types/fees'

/** A month of fee movement — collected and still pending, in paise. */
export interface ReportTrendPoint {
  label: string
  collectedPaise: number
  pendingPaise: number
}

export interface ReportClassOption {
  id: string
  label: string
  grade: number
  section: string
}

/** The Overview tab: school-wide totals, the twelve-month fee picture and the class catalogue. */
export interface ReportsOverview {
  activeStudents: number
  activeTeachers: number
  collectedPaise: number
  pendingPaise: number
  feeTrend: ReportTrendPoint[]
  classes: ReportClassOption[]
}

/** One class's register over the report's period. */
export interface AttendanceReportRow {
  classId: string
  className: string
  present: number
  total: number
  /** 0–100, rounded. Present and late both count as attended. */
  percentage: number
}

/** The Attendance tab: the register for one month, optionally narrowed to a class. */
export interface AttendanceReport {
  month: number
  year: number
  /** Ready to render, e.g. `Aug 2026`. */
  label: string
  byClass: AttendanceReportRow[]
  totals: {
    present: number
    total: number
    percentage: number
  }
}

/** One selectable paper — an exam's subject for one class. */
export interface ExamPaperOption {
  id: string
  examId: string
  subjectId: string
  /** e.g. `Mid Term Examination — English — 2-B`. */
  label: string
  status: ExamStatus
}

export interface ExamResultRow {
  studentId: string
  studentName: string
  admissionNo: string
  rollNo: number
  /** Null when the paper has no mark for this student — they were absent, or it is unmarked. */
  marks: number | null
  maxMarks: number
  percentage: number | null
  grade: string | null
  passed: boolean | null
}

export interface GradeBucket {
  grade: string
  students: number
}

/** The Exam Results tab: one paper's marks, distribution and per-student outcome. */
export interface ExamResultsReport {
  paperId: string
  paperLabel: string
  examName: string
  subjectName: string
  className: string
  examDate: string
  maxMarks: number
  totalStudents: number
  passed: number
  failed: number
  averagePercentage: number
  gradeDistribution: GradeBucket[]
  rows: ExamResultRow[]
}

/** One outstanding demand on the Finance tab, with what was billed, paid and left. */
export interface PendingFeeRecord {
  invoiceId: string
  studentId: string
  studentName: string
  className: string
  feeTitle: string
  totalPaise: number
  paidPaise: number
  balancePaise: number
  dueDate: string
  status: InvoiceStatus
}

/** The Finance tab: collection totals, the twelve-month picture and the pending register. */
export interface FinanceReport {
  totalCollectedPaise: number
  totalPendingPaise: number
  /** Collected as a share of what was billed, 0–100. */
  collectionRate: number
  monthly: ReportTrendPoint[]
  pending: PendingFeeRecord[]
  pendingCount: number
}
