import type { Exam, ExamResult, ExamSubject, ReportCard } from '@/types/exams'
import { SCHOOL_ID, dateOffset, dateTimeOffset } from '@/data/seed'
import { classes } from '@/data/classes'
import { students } from '@/data/students'
import { subjectsForClass } from '@/data/subjects'

const MAX_MARKS = 100
const PASS_MARKS = 40

/** One mid-term exam per class; the first three are already published. */
export const exams: Exam[] = classes.map((classRoom, offset) => {
  const isPublished = offset < 3

  return {
    id: `exam_${offset + 1}`,
    schoolId: SCHOOL_ID,
    classId: classRoom.id,
    name: 'Mid Term Examination',
    type: 'MID',
    startDate: dateOffset(-21),
    endDate: dateOffset(-15),
    isPublished,
    publishedAt: isPublished ? dateTimeOffset(-10, 14, 0) : null,
  }
})

export const examSubjects: ExamSubject[] = exams.flatMap((exam, examOffset) =>
  subjectsForClass(exam.classId).map((subject, subjectOffset) => ({
    id: `exs_${examOffset + 1}_${subjectOffset + 1}`,
    schoolId: SCHOOL_ID,
    examId: exam.id,
    subjectId: subject.id,
    examDate: dateOffset(-21 + subjectOffset),
    maxMarks: MAX_MARKS,
    passMarks: PASS_MARKS,
  })),
)

function marksFor(studentOffset: number, subjectOffset: number): { obtained: number; isAbsent: boolean } {
  const isAbsent = (studentOffset + subjectOffset * 3) % 17 === 0
  if (isAbsent) return { obtained: 0, isAbsent: true }

  return { obtained: 42 + ((studentOffset * 7 + subjectOffset * 11) % 55), isAbsent: false }
}

export const examResults: ExamResult[] = exams.flatMap((exam, examOffset) =>
  students
    .filter((student) => student.classId === exam.classId)
    .flatMap((student, studentOffset) =>
      subjectsForClass(exam.classId).map((subject, subjectOffset) => {
        const { obtained, isAbsent } = marksFor(studentOffset + examOffset, subjectOffset)

        return {
          id: `res_${examOffset + 1}_${student.id}_${subjectOffset + 1}`,
          schoolId: SCHOOL_ID,
          examId: exam.id,
          studentId: student.id,
          subjectId: subject.id,
          obtainedMarks: obtained,
          isAbsent,
          enteredById: subject.teacherId ? `usr_${subject.teacherId}` : null,
        }
      }),
    ),
)

function gradeFor(percentage: number): string {
  if (percentage >= 80) return 'A+'
  if (percentage >= 70) return 'A'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D'
  return 'F'
}

/** Published exams only — a report card is written at publish time. */
export const reportCards: ReportCard[] = exams
  .filter((exam) => exam.isPublished)
  .flatMap((exam) => {
    const examSubjectCount = subjectsForClass(exam.classId).length
    const totalMarks = examSubjectCount * MAX_MARKS
    const cohort = students.filter((student) => student.classId === exam.classId)

    const scored = cohort.map((student) => {
      const obtainedMarks = examResults
        .filter((result) => result.examId === exam.id && result.studentId === student.id)
        .reduce((total, result) => total + result.obtainedMarks, 0)

      return { student, obtainedMarks, percentage: Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) }
    })

    return scored.map((entry) => {
      const ranked = [...scored].sort((left, right) => right.percentage - left.percentage)
      const rank = ranked.findIndex((item) => item.student.id === entry.student.id) + 1

      return {
        id: `rc_${exam.id}_${entry.student.id}`,
        schoolId: SCHOOL_ID,
        examId: exam.id,
        studentId: entry.student.id,
        totalMarks,
        obtainedMarks: entry.obtainedMarks,
        percentage: entry.percentage,
        grade: gradeFor(entry.percentage),
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
export const gradeForPercentage = gradeFor
