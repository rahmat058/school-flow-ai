import type { Homework, HomeworkSubmission } from '@/types/homework'
import { SCHOOL_ID, dateOffset, dateTimeOffset } from '@/data/seed'
import { students } from '@/data/students'
import { findSubject } from '@/data/subjects'

interface HomeworkSpec {
  classIndex: number
  subjectIndex: number
  title: string
  description: string
  dueInDays: number
  maxMarks: number | null
  attachments: string[]
}

const SPECS: HomeworkSpec[] = [
  {
    classIndex: 1,
    subjectIndex: 2,
    title: 'Fractions — worksheet 4B',
    description: 'Complete exercises 1–12. Show all working.',
    dueInDays: 2,
    maxMarks: 20,
    attachments: ['https://res.cloudinary.com/school-flow/worksheets/fractions-4b.pdf'],
  },
  {
    classIndex: 1,
    subjectIndex: 1,
    title: 'Essay: my neighbourhood',
    description: 'Write 200 words describing your neighbourhood.',
    dueInDays: 4,
    maxMarks: null,
    attachments: [],
  },
  {
    classIndex: 2,
    subjectIndex: 3,
    title: 'Plant cell diagram',
    description: 'Draw and label a plant cell, then list three differences from an animal cell.',
    dueInDays: 1,
    maxMarks: 10,
    attachments: ['https://res.cloudinary.com/school-flow/worksheets/plant-cell.pdf'],
  },
  {
    classIndex: 3,
    subjectIndex: 2,
    title: 'Algebra practice set 7',
    description: 'Solve the linear equations in set 7.',
    dueInDays: -1,
    maxMarks: 25,
    attachments: [],
  },
  {
    classIndex: 4,
    subjectIndex: 1,
    title: 'Reading comprehension — unit 5',
    description: 'Read the passage and answer questions 1–8.',
    dueInDays: 3,
    maxMarks: 15,
    attachments: ['https://res.cloudinary.com/school-flow/worksheets/unit-5-reading.pdf'],
  },
  {
    classIndex: 5,
    subjectIndex: 5,
    title: 'Spreadsheet basics',
    description: 'Build a marks table and add SUM and AVERAGE formulas.',
    dueInDays: 5,
    maxMarks: null,
    attachments: [],
  },
  {
    classIndex: 6,
    subjectIndex: 4,
    title: 'Map skills exercise',
    description: 'Locate the districts on the outline map supplied in class.',
    dueInDays: 2,
    maxMarks: 20,
    attachments: [],
  },
  {
    classIndex: 3,
    subjectIndex: 3,
    title: 'Acids and bases — lab report',
    description: 'Write up the litmus and pH tests from Thursday’s practical.',
    dueInDays: 6,
    maxMarks: 30,
    attachments: ['https://res.cloudinary.com/school-flow/worksheets/acids-bases.pdf'],
  },
  {
    classIndex: 2,
    subjectIndex: 1,
    title: 'Grammar worksheet — tenses',
    description: 'Fill in the correct tense in each sentence, then rewrite five of your own.',
    dueInDays: 7,
    maxMarks: 10,
    attachments: [],
  },
  {
    classIndex: 1,
    subjectIndex: 6,
    title: 'Fitness log — one week',
    description: 'Record your daily activity for a week and note how you felt afterwards.',
    dueInDays: -2,
    maxMarks: null,
    attachments: [],
  },
  {
    classIndex: 3,
    subjectIndex: 5,
    title: 'Typing practice — level 3',
    description: 'Finish level 3 in the typing tutor and note your accuracy score.',
    dueInDays: 1,
    maxMarks: null,
    attachments: [],
  },
  {
    classIndex: 4,
    subjectIndex: 4,
    title: 'Neighbourhood map',
    description: 'Draw a map of the roads around your home and mark the school route.',
    dueInDays: 4,
    maxMarks: 20,
    attachments: [],
  },
]

export const homework: Homework[] = SPECS.map((spec, index) => {
  const subjectId = `sub_${spec.classIndex}_${spec.subjectIndex}`

  return {
    id: `hw_${index + 1}`,
    schoolId: SCHOOL_ID,
    classId: `cls_${spec.classIndex}`,
    subjectId,
    teacherId: findSubject(subjectId)?.teacherId ?? 'tch_1',
    title: spec.title,
    description: spec.description,
    dueDate: dateOffset(spec.dueInDays),
    maxMarks: spec.maxMarks,
    attachments: spec.attachments,
    deletedAt: null,
  }
})

const GRADES = ['A+', 'A', 'B+', 'B']

export const homeworkSubmissions: HomeworkSubmission[] = homework.flatMap((assignment, homeworkOffset) =>
  students
    .filter((student) => student.classId === assignment.classId)
    .map((student, studentOffset) => {
      // Two of every three students have submitted; the rest are still pending.
      if ((studentOffset + homeworkOffset) % 3 === 2) return null

      const isLate = (studentOffset + homeworkOffset) % 5 === 4
      const isGraded = (studentOffset + homeworkOffset) % 2 === 0
      const submittedAt = dateTimeOffset(-(homeworkOffset % 6) + 1, 20, 15)

      const submission: HomeworkSubmission = {
        id: `hws_${assignment.id}_${student.id}`,
        schoolId: SCHOOL_ID,
        homeworkId: assignment.id,
        studentId: student.id,
        files: isLate ? [] : [`https://res.cloudinary.com/school-flow/submissions/${student.id}-${assignment.id}.pdf`],
        submittedAt,
        isLate,
        grade: isGraded ? GRADES[(studentOffset + homeworkOffset) % GRADES.length] : null,
        remarks: isGraded ? 'Good work — keep it up.' : null,
        gradedById: isGraded ? assignment.teacherId : null,
        gradedAt: isGraded ? dateTimeOffset(-(homeworkOffset % 5), 18, 0) : null,
      }

      return submission
    })
    .filter((submission): submission is HomeworkSubmission => submission !== null),
)
