import type { ClassSubject, Subject } from '@/types/academic'
import { SCHOOL_ID } from '@/data/seed'
import { classes } from '@/data/classes'

interface SubjectSpec {
  name: string
  code: string
  description: string
}

/** The school's subject catalogue — codes are the school's own and appear on every chip and badge. */
const CATALOGUE: SubjectSpec[] = [
  { name: 'Art & Craft', code: 'ART', description: 'Drawing, painting and craft work.' },
  { name: 'Biology', code: 'BIO', description: 'Life processes, plants and human biology.' },
  { name: 'General Knowledge', code: 'GK', description: 'Current affairs and general awareness.' },
  { name: 'Islamic Studies', code: 'ISL', description: 'Deeniyat and moral education.' },
  { name: 'Physical Education', code: 'PE', description: 'Sports, fitness and health.' },
  { name: 'Chemistry', code: 'CHEM', description: 'Matter, reactions and periodic classification.' },
  { name: 'Computer Science', code: 'CS', description: 'Computers, coding and digital literacy.' },
  { name: 'Environmental Studies', code: 'EVS', description: 'Our surroundings, plants and the environment.' },
  { name: 'Physics', code: 'PHY', description: 'Motion, energy and the physical world.' },
  { name: 'Science', code: 'SCI', description: 'General science for the junior classes.' },
  { name: 'Social Science', code: 'SST', description: 'History, geography and civics.' },
  { name: 'Hindi', code: 'HIN', description: 'Reading, writing and literature in Hindi.' },
  { name: 'Mathematics', code: 'MATH', description: 'Numbers, algebra and geometry.' },
  { name: 'Urdu', code: 'URD', description: 'Reading, writing and literature in Urdu.' },
  { name: 'English', code: 'ENG', description: 'Language, reading and composition.' },
]

export const subjects: Subject[] = CATALOGUE.map((spec) => ({
  id: `subj_${spec.code.toLowerCase()}`,
  schoolId: SCHOOL_ID,
  name: spec.name,
  code: spec.code,
  description: spec.description,
}))

/** The subjects every class runs — the core week the lesson, homework and exam seeds build on. */
export const CORE_SUBJECT_CODES = ['ENG', 'MATH', 'SCI', 'SST', 'CS', 'PE'] as const

/** What a grade band adds on top of the core six, so the assignment matrix is not one flat set. */
const EXTRAS_BY_GRADE: Record<number, string[]> = {
  1: ['ART', 'GK'],
  2: ['ART', 'GK'],
  3: ['ART', 'ISL'],
  4: ['ART', 'ISL'],
  5: ['ART', 'ISL'],
  6: ['EVS', 'ISL'],
  7: ['EVS', 'ISL'],
  8: ['EVS', 'ISL'],
  9: ['EVS', 'ISL'],
  10: ['PHY'],
}

/** Kept in step with `data/teachers.ts`, which seeds this many teachers. */
const TEACHER_COUNT = 8

/**
 * Which class offers which subject, and who teaches it. The rotation spreads the staff across the
 * week the way `data/timetable.ts` did before subjects were a catalogue — every class gets a
 * different teacher for each subject rather than one for all of them.
 */
export const classSubjects: ClassSubject[] = classes.flatMap((classRoom, classOffset) => {
  const codes = [...CORE_SUBJECT_CODES, ...(EXTRAS_BY_GRADE[classRoom.grade] ?? [])]

  return codes.flatMap((code, subjectOffset) => {
    const subject = findSubjectByCode(code)
    if (!subject) return []

    return [
      {
        id: `cs_${classRoom.id.replace('cls_', '')}_${subject.id.replace('subj_', '')}`,
        schoolId: SCHOOL_ID,
        classId: classRoom.id,
        subjectId: subject.id,
        teacherId: `tch_${((classOffset + subjectOffset) % TEACHER_COUNT) + 1}`,
      },
    ]
  })
})

export function findSubject(id: string): Subject | undefined {
  return subjects.find((subject) => subject.id === id)
}

export function findSubjectByCode(code: string): Subject | undefined {
  return subjects.find((subject) => subject.code === code)
}

/** The catalogue subjects one class offers, in the order the assignment stores them. */
export function subjectsForClass(classId: string): Subject[] {
  return classSubjects
    .filter((link) => link.classId === classId)
    .flatMap((link) => {
      const subject = findSubject(link.subjectId)
      return subject ? [subject] : []
    })
}

/** The assignment row for a class and subject — where the class's teacher for that subject lives. */
export function classSubjectFor(classId: string, subjectId: string): ClassSubject | undefined {
  return classSubjects.find((link) => link.classId === classId && link.subjectId === subjectId)
}

/** Resolve a subject by its code for a class — how the lesson/homework seeds name what they target. */
export function subjectForClassCode(classId: string, code: string): Subject | undefined {
  return subjectsForClass(classId).find((subject) => subject.code === code)
}
