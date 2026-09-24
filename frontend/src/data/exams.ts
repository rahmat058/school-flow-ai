import type { Exam, ExamResult, ExamSubject, ReportCard } from '@/types/exams'
import { SCHOOL_ID, dateOffset, dateTimeOffset } from '@/data/seed'
import { classes } from '@/data/classes'
import { students } from '@/data/students'
import { subjectsForClass } from '@/data/subjects'
import { gradeForPercentage } from '@/lib/grades'

const MAX_MARKS = 100
const PASS_MARKS = 40
const EXAM_DURATION_MIN = 180
const UNIT_DURATION_MIN = 60
const TEST_DURATION_MIN = 40

const TODAY = dateOffset(0)

/** Single-subject class tests — the Tests tab's rows, drawn one subject from the class's catalogue. */
const TEST_SEEDS = [
  { classOffset: 8, subjectIndex: 0, title: 'English Class Test 1', examDate: dateOffset(-6), maxMarks: 20 },
  { classOffset: 8, subjectIndex: 3, title: 'Social Studies Class Test 1', examDate: dateOffset(4), maxMarks: 20 },
  { classOffset: 3, subjectIndex: 1, title: 'Mathematics Class Test 1', examDate: dateOffset(-2), maxMarks: 25 },
  { classOffset: 12, subjectIndex: 4, title: 'ICT Class Test 1', examDate: dateOffset(6), maxMarks: 20 },
]

/**
 * Every assessment on record. **Tests and exams share this table**, told apart by `kind`: a test is
 * one subject sat on one date, an exam is a multi-subject window. The mid terms are history (the
 * first three classes already published) and the unit tests are still ahead — which is what makes
 * the dashboard's upcoming list real rather than invented.
 */
export const exams: Exam[] = [
  ...classes.map((classRoom, offset) => ({
    id: `exam_${offset + 1}`,
    schoolId: SCHOOL_ID,
    classId: classRoom.id,
    name: 'Mid Term Examination',
    kind: 'EXAM' as const,
    type: 'MID' as const,
    startDate: dateOffset(-21),
    endDate: dateOffset(-15),
    description: 'Board-pattern examination covering every subject taught this term.',
    isPublished: offset < 3,
    publishedAt: offset < 3 ? dateTimeOffset(-10, 14, 0) : null,
  })),
  ...classes.map((classRoom, offset) => ({
    id: `exam_unit_${offset + 1}`,
    schoolId: SCHOOL_ID,
    classId: classRoom.id,
    name: 'Unit Test 2',
    kind: 'EXAM' as const,
    type: 'UNIT' as const,
    startDate: dateOffset(7),
    endDate: dateOffset(19),
    description: null,
    isPublished: false,
    publishedAt: null as string | null,
  })),
  ...TEST_SEEDS.map((seed, offset) => ({
    id: `test_${offset + 1}`,
    schoolId: SCHOOL_ID,
    classId: classes[seed.classOffset].id,
    name: seed.title,
    kind: 'TEST' as const,
    type: 'UNIT' as const,
    startDate: seed.examDate,
    endDate: seed.examDate,
    description: 'Single-subject class test.',
    isPublished: seed.examDate <= TODAY,
    publishedAt: seed.examDate <= TODAY ? dateTimeOffset(-1, 16, 0) : null,
  })),
]

export const examSubjects: ExamSubject[] = [
  ...exams
    .filter((exam) => exam.kind === 'EXAM')
    .flatMap((exam, examOffset) => {
      const unit = exam.type === 'UNIT'

      return subjectsForClass(exam.classId).map((subject, subjectOffset) => ({
        id: `exs_${examOffset + 1}_${subjectOffset + 1}`,
        schoolId: SCHOOL_ID,
        examId: exam.id,
        subjectId: subject.id,
        examDate: dateOffset((unit ? 7 : -21) + subjectOffset * (unit ? 2 : 1)),
        maxMarks: MAX_MARKS,
        passMarks: PASS_MARKS,
        durationMin: unit ? UNIT_DURATION_MIN : EXAM_DURATION_MIN,
      }))
    }),
  ...TEST_SEEDS.map((seed, offset) => {
    const subject = subjectsForClass(classes[seed.classOffset].id)[seed.subjectIndex]

    return {
      id: `exs_test_${offset + 1}`,
      schoolId: SCHOOL_ID,
      examId: `test_${offset + 1}`,
      subjectId: subject.id,
      examDate: seed.examDate,
      maxMarks: seed.maxMarks,
      passMarks: Math.round(seed.maxMarks * (PASS_MARKS / MAX_MARKS)),
      durationMin: TEST_DURATION_MIN,
    }
  }),
]

/** Scaled to the paper, so a 20-mark test and a 100-mark paper both land in the same bands. */
function marksFor(
  studentOffset: number,
  subjectOffset: number,
  maxMarks: number,
): { obtained: number; isAbsent: boolean } {
  const isAbsent = (studentOffset + subjectOffset * 3) % 17 === 0
  if (isAbsent) return { obtained: 0, isAbsent: true }

  const share = 0.42 + ((studentOffset * 7 + subjectOffset * 11) % 55) / 100

  return { obtained: Math.round(maxMarks * share), isAbsent: false }
}

/** The subject's teacher is the one of record for the mark. */
function enteredByFor(examId: string, classId: string, subjectId: string): string | null {
  const exam = exams.find((item) => item.id === examId)
  if (!exam) return null

  const subject = subjectsForClass(classId).find((item) => item.id === subjectId)
  return subject?.teacherId ? `usr_${subject.teacherId}` : null
}

/** Marks only exist for papers that have been sat — a future test has no results yet. */
export const examResults: ExamResult[] = exams
  .filter((exam) => exam.startDate <= TODAY)
  .flatMap((exam) =>
    students
      .filter((student) => student.classId === exam.classId)
      .flatMap((student, studentOffset) =>
        examSubjects
          .filter((paper) => paper.examId === exam.id)
          .map((paper, subjectOffset) => {
            const { obtained, isAbsent } = marksFor(studentOffset, subjectOffset, paper.maxMarks)

            return {
              id: `res_${exam.id}_${student.id}_${subjectOffset + 1}`,
              schoolId: SCHOOL_ID,
              examId: exam.id,
              studentId: student.id,
              subjectId: paper.subjectId,
              obtainedMarks: obtained,
              isAbsent,
              remarks: null,
              enteredById: enteredByFor(exam.id, exam.classId, paper.subjectId),
            }
          }),
      ),
  )

/** Published exams only — a report card is written at publish time, never for a single-subject test. */
export const reportCards: ReportCard[] = exams
  .filter((exam) => exam.kind === 'EXAM' && exam.isPublished)
  .flatMap((exam) => {
    const totalMarks = examSubjects
      .filter((paper) => paper.examId === exam.id)
      .reduce((total, paper) => total + paper.maxMarks, 0)
    const cohort = students.filter((student) => student.classId === exam.classId)

    const scored = cohort.map((student) => {
      const obtainedMarks = examResults
        .filter((result) => result.examId === exam.id && result.studentId === student.id)
        .reduce((total, result) => total + result.obtainedMarks, 0)

      return { student, obtainedMarks, percentage: Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) }
    })

    const ranked = [...scored].sort((left, right) => right.percentage - left.percentage)

    return scored.map((entry) => {
      const rank = ranked.findIndex((item) => item.student.id === entry.student.id) + 1

      return {
        id: `rc_${exam.id}_${entry.student.id}`,
        schoolId: SCHOOL_ID,
        examId: exam.id,
        studentId: entry.student.id,
        totalMarks,
        obtainedMarks: entry.obtainedMarks,
        percentage: entry.percentage,
        grade: gradeForPercentage(entry.percentage),
        rank,
        aiComment:
          rank === 1
            ? 'Topped the class this term. Strong across all subjects — encourage extension work.'
            : `Ranked ${rank} of ${cohort.length}. Steady progress; targeted revision in the weakest subject would help.`,
        publishedAt: exam.publishedAt,
      }
    })
  })

export const maxMarks = MAX_MARKS
