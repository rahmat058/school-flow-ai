import type { Subject, SubjectName } from '@/types/academic'
import { SUBJECT_NAMES } from '@/lib/options'
import { SCHOOL_ID } from '@/data/seed'
import { classLabel, classes } from '@/data/classes'

interface SubjectTemplate {
  name: SubjectName
  code: string
}

const SUBJECT_CODES: Record<SubjectName, string> = {
  English: 'ENG',
  Mathematics: 'MAT',
  Science: 'SCI',
  'Social Studies': 'SST',
  ICT: 'ICT',
  'Physical Education': 'PED',
}

/** Taught in every class; codes are suffixed with the class (e.g. `MAT-5-A`). */
const TEMPLATES: SubjectTemplate[] = SUBJECT_NAMES.map((name) => ({ name, code: SUBJECT_CODES[name] }))

export const subjectTemplates = TEMPLATES

/** `sub_{classIndex}_{subjectIndex}` — referenced by exams, homework and timetables. */
export const subjects: Subject[] = classes.flatMap((classRoom, classOffset) =>
  TEMPLATES.map((template, subjectOffset) => ({
    id: `sub_${classOffset + 1}_${subjectOffset + 1}`,
    schoolId: SCHOOL_ID,
    classId: classRoom.id,
    name: template.name,
    code: `${template.code}-${classLabel(classRoom)}`,
    // Rotate teachers so classes do not all share one teacher.
    teacherId: `tch_${((classOffset + subjectOffset) % 8) + 1}`,
  })),
)

export function subjectsForClass(classId: string): Subject[] {
  return subjects.filter((subject) => subject.classId === classId)
}

export function findSubject(id: string): Subject | undefined {
  return subjects.find((subject) => subject.id === id)
}
