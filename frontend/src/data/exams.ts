import type { Exam, ExamResult, ExamSubject, ReportCard } from '@/types/exams'
import { SCHOOL_ID, dateOffset, dateTimeOffset } from '@/data/seed'
import { classes } from '@/data/classes'
import { students } from '@/data/students'
import { classSubjectFor, subjectsForClass } from '@/data/subjects'
import { gradeForPercentage } from '@/lib/grades'

const MAX_MARKS = 100
const PASS_MARKS = 40
const EXAM_DURATION_MIN = 180
const UNIT_DURATION_MIN = 60
const TEST_DURATION_MIN = 40

const TODAY = dateOffset(0)

/** One class test: a single subject sat on a single date. */
interface TestSeed {
  classId: string
  subjectId: string
  title: string
  examDate: string
  maxMarks: number
}

/**
 * Two tests per class — one already sat and one still ahead — drawn from that class's own catalogue
 * and rotated by class so the titles vary. Every class needs a record: a student's Tests tab reads
 * their own class only, and a demo login in a class with no tests would open on an empty screen.
 */
const TEST_SEEDS: TestSeed[] = classes.flatMap((classRoom, classOffset) => {
  const subjects = subjectsForClass(classRoom.id)
  if (subjects.length === 0) return []

  const sat = subjects[classOffset % subjects.length]
  const ahead = subjects[(classOffset + 1) % subjects.length]

  return [
    {
      classId: classRoom.id,
      subjectId: sat.id,
      title: `${sat.name} Class Test 1`,
      examDate: dateOffset(-6 - (classOffset % 5)),
      maxMarks: 20,
    },
    {
      classId: classRoom.id,
      subjectId: ahead.id,
      title: `${ahead.name} Class Test 2`,
      examDate: dateOffset(4 + (classOffset % 5)),
      maxMarks: 20,
    },
  ]
})

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
    endDate: dateOffset(-14),
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
    // Wide enough for every subject a class runs — a grade-10 class sits one paper fewer.
    endDate: dateOffset(21),
    description: null,
    isPublished: false,
    publishedAt: null as string | null,
  })),
  ...TEST_SEEDS.map((seed, offset) => ({
    id: `test_${offset + 1}`,
    schoolId: SCHOOL_ID,
    classId: seed.classId,
    name: seed.title,
    kind: 'TEST' as const,
    type: 'UNIT' as const,
    startDate: seed.examDate,
    endDate: seed.examDate,
    description: 'Single-subject class test.',
    isPublished: seed.examDate <= TODAY,
    publishedAt: seed.examDate <= TODAY ? dateTimeOffset(-1, 16, 0) : (null as string | null),
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
  ...TEST_SEEDS.map((seed, offset) => ({
    id: `exs_test_${offset + 1}`,
    schoolId: SCHOOL_ID,
    examId: `test_${offset + 1}`,
    subjectId: seed.subjectId,
    examDate: seed.examDate,
    maxMarks: seed.maxMarks,
    passMarks: Math.round(seed.maxMarks * (PASS_MARKS / MAX_MARKS)),
    durationMin: TEST_DURATION_MIN,
  })),
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

/**
 * A teacher's note beside a mark — deliberately the exception, not the rule, and never on a paper the
 * student missed. The Progress screen's Teacher remarks tab reads only the published ones that carry
 * a note, so a couple of these per class are enough to give it something real to show.
 */
const REMARK_TEMPLATES = [
  'Consistent effort in class; keep it up.',
  'Needs more practice with the tougher problems.',
  'Excellent presentation — clear and well organised.',
  'Participation has improved a lot this term.',
  'Revise the earlier chapters before the next test.',
  'Strong grasp of the fundamentals.',
]

function remarkFor(studentOffset: number, subjectOffset: number): string | null {
  if ((studentOffset + subjectOffset) % 3 !== 0) return null
  return REMARK_TEMPLATES[(studentOffset * 2 + subjectOffset) % REMARK_TEMPLATES.length]
}

/** The subject's teacher is the one of record for the mark. */
function enteredByFor(examId: string, classId: string, subjectId: string): string | null {
  const exam = exams.find((item) => item.id === examId)
  if (!exam) return null

  const link = classSubjectFor(classId, subjectId)
  return link?.teacherId ? `usr_${link.teacherId}` : null
}

/** Marks only exist for papers that have been sat — a future test has no results yet. */
export const examResults: ExamResult[] = exams
  .filter((exam) => exam.startDate <= TODAY)
  .flatMap((exam) =>
    students
      .filter((student) => student.classId === exam.classId)
      .flatMap((student) =>
        examSubjects
          .filter((paper) => paper.examId === exam.id)
          .map((paper, subjectOffset) => {
            // Spread absence by the student's **school-wide** index, not their class position: with
            // one or two students per class, a per-class offset makes the same seat (the first)
            // absent in every class, so the demo login misses every single-subject test.
            const seat = students.indexOf(student) + 1
            const { obtained, isAbsent } = marksFor(seat, subjectOffset, paper.maxMarks)

            return {
              id: `res_${exam.id}_${student.id}_${subjectOffset + 1}`,
              schoolId: SCHOOL_ID,
              examId: exam.id,
              studentId: student.id,
              subjectId: paper.subjectId,
              obtainedMarks: obtained,
              isAbsent,
              remarks: isAbsent ? null : remarkFor(seat, subjectOffset),
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
