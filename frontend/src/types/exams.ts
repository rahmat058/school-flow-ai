import type { StatMetric } from '@/types/dashboard'
import type { StudentSubject } from '@/types/people'

/** `UNIT` and `MID` are the seeded terms; `ANNUAL` is the year-end examination. */
export type ExamType = 'UNIT' | 'MID' | 'FINAL' | 'ANNUAL'

/** A `TEST` is one subject sat on one date; an `EXAM` is a multi-subject window. */
export type ExamKind = 'TEST' | 'EXAM'

/** Derived from the dates, never stored: `COMPLETED` once the window has passed. */
export type ExamStatus = 'UPCOMING' | 'COMPLETED'

export interface Exam {
  id: string
  schoolId: string
  classId: string
  name: string
  kind: ExamKind
  type: ExamType
  startDate: string
  endDate: string
  description: string | null
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
  /** The paper's duration in minutes. */
  durationMin: number
}

export interface ExamResult {
  id: string
  schoolId: string
  examId: string
  studentId: string
  subjectId: string
  obtainedMarks: number
  isAbsent: boolean
  remarks: string | null
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

/** One subject of an exam, resolved for the schedule list and the edit form. */
export interface ExamSubjectRow {
  id: string
  subjectId: string
  subjectName: string
  subjectCode: string
  examDate: string
  maxMarks: number
  durationMin: number
}

/** A row in the Tests tab — a single-subject assessment. */
export interface TestListItem {
  id: string
  name: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  subjectCode: string
  examDate: string
  maxMarks: number
  durationMin: number
  status: ExamStatus
  isPublished: boolean
}

/** A row in the Exams tab — a multi-subject window with its subject schedule. */
export interface ExamListItem {
  id: string
  name: string
  type: ExamType
  classId: string
  className: string
  startDate: string
  endDate: string
  status: ExamStatus
  isPublished: boolean
  subjects: ExamSubjectRow[]
}

/** What the test form sends — `kind` is always `TEST`, and the exam dates mirror the paper's. */
export interface TestInput {
  classId: string
  subjectId: string
  name: string
  examDate: string
  maxMarks: number
  durationMin: number
  description: string | null
}

/** What the exam form sends. The subject set is replaced whole, dates and marks included. */
export interface ExamInput {
  classId: string
  name: string
  type: ExamType
  startDate: string
  endDate: string
  description: string | null
  subjects: Array<{ subjectId: string; examDate: string; maxMarks: number; durationMin: number }>
}

/** One subject tab of the marks sheet. */
export interface ResultSubjectTab {
  subjectId: string
  subjectName: string
  subjectCode: string
  examDate: string
  maxMarks: number
  /** How many of the class already hold a mark in this subject. */
  enteredCount: number
}

export interface ResultStudentRow {
  studentId: string
  studentName: string
  admissionNo: string
  rollNo: number
}

/** A cell of the sheet — `marks` is null until something is entered. */
export interface ResultEntryRow {
  studentId: string
  subjectId: string
  marks: number | null
  remarks: string | null
  isAbsent: boolean
}

/** Everything the Results tab renders for one exam, in one payload. */
export interface ResultSheet {
  examId: string
  examName: string
  type: ExamType
  kind: ExamKind
  classId: string
  className: string
  isPublished: boolean
  subjects: ResultSubjectTab[]
  students: ResultStudentRow[]
  entries: ResultEntryRow[]
}

/** What Save All posts — the rows the grid holds, already parsed. */
export interface ResultEntryInput {
  studentId: string
  subjectId: string
  marks: number | null
  remarks: string | null
}

/** A test of the student's own class — one row of the Tests tab. */
export interface StudentTestRow {
  id: string
  name: string
  description: string | null
  subjectName: string
  examDate: string
  maxMarks: number
  passMarks: number | null
  durationMin: number
  status: ExamStatus
  /** Whole days from today — what the row's countdown reads. */
  daysAway: number
}

/** One paper of an exam the student's class sits. */
export interface StudentExamPaperRow {
  id: string
  subjectName: string
  subjectCode: string
  examDate: string
  maxMarks: number
  passMarks: number | null
  durationMin: number
  daysAway: number
}

/** An exam ahead for the student's class — the Exams tab's card and its paper schedule. */
export interface StudentExamRow {
  id: string
  name: string
  type: ExamType
  description: string | null
  startDate: string
  endDate: string
  /** Days the window spans; never zero, since a one-day window still runs a day. */
  durationDays: number
  daysAway: number
  status: ExamStatus
  papers: StudentExamPaperRow[]
  totalMarks: number
  totalPassMarks: number
}

/**
 * One of the student's own published marks. The field names match `StudentMarkRow`, so the same rows
 * feed the result PDF without a second mapping.
 */
export interface StudentResultRow {
  id: string
  examName: string
  examType: ExamType
  subjectName: string
  date: string
  marks: number
  total: number
  percentage: number
  grade: string
  result: 'PASS' | 'FAIL'
  isPublished: boolean
  remarks: string | null
}

/** One subject's showing across the student's results — the My Results tab's bars. */
export interface StudentSubjectPerformance {
  subjectName: string
  results: number
  percentage: number
}

/** The numbers behind the My Results summary — the cards read the same figures. */
export interface StudentExamsSummary {
  passed: number
  failed: number
  averageScore: number
  /** Passed ÷ results, whole percent. */
  passRate: number
}

/** A student the caller may read — a guardian's children, or a student's own single entry. */
export type ExamSubjectOption = StudentSubject

/**
 * `GET /exams/me` — the caller's own tests, exams and marks in one payload. Self-scoped: a student
 * comes from the session, and a guardian may name one of their own children with `?studentId=`, so
 * every row belongs to whoever the payload names.
 */
export interface StudentExams {
  /** The headline cards, display-ready. */
  stats: StatMetric[]
  summary: StudentExamsSummary
  /** Tab labels: every test and exam on the class's record, and the student's own result count. */
  counts: { tests: number; exams: number; results: number }
  /** Tests still ahead, soonest first. */
  upcomingTests: StudentTestRow[]
  /** Exam windows still ahead, soonest first. */
  upcomingExams: StudentExamRow[]
  /** The student's published marks, newest first. */
  results: StudentResultRow[]
  /** Average per subject, highest first. */
  subjectPerformance: StudentSubjectPerformance[]
  /** Whose record this is — the student's name, or a guardian's chosen child. */
  subjectLabel: string
  /** The student's class label (`1-A`); empty when the class is unknown. */
  subjectMeta: string
  /** The students the caller may switch between; a student's own account holds one entry. */
  students: ExamSubjectOption[]
}
