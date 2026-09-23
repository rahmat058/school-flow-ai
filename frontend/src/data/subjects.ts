import type { Subject } from '@/types/academic'
import { SCHOOL_ID } from '@/data/seed'
import { classes } from '@/data/classes'

interface SubjectTemplate {
  name: string
  code: string
}

/** Taught in every class; codes are suffixed with the class (e.g. `MAT-5A`). */
const TEMPLATES: SubjectTemplate[] = [
  { name: 'English', code: 'ENG' },
  { name: 'Mathematics', code: 'MAT' },
  { name: 'Science', code: 'SCI' },
  { name: 'Social Studies', code: 'SST' },
  { name: 'ICT', code: 'ICT' },
  { name: 'Physical Education', code: 'PED' },
]

export const subjectTemplates = TEMPLATES

/** `sub_{classIndex}_{subjectIndex}` — referenced by exams, homework and timetables. */
export const subjects: Subject[] = classes.flatMap((classRoom, classOffset) =>
  TEMPLATES.map((template, subjectOffset) => ({
    id: `sub_${classOffset + 1}_${subjectOffset + 1}`,
    schoolId: SCHOOL_ID,
    classId: classRoom.id,
    name: template.name,
    code: `${template.code}-${classRoom.grade}${classRoom.section}`,
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
