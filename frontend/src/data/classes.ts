import type { ClassRoom } from '@/types/academic'
import { ACADEMIC_YEAR, SCHOOL_ID } from '@/data/seed'
import { CLASS_GRADES, CLASS_SECTIONS } from '@/lib/options'

/** Kept in step with `data/teachers.ts`, which seeds this many teachers. */
const HOMEROOM_TEACHERS = 8

/**
 * Every class the school runs: grades 1–10, each with an A and a B section. The grade and section
 * lists live in `lib/options.ts`, so the catalogue and the class list are one source.
 */
export const classes: ClassRoom[] = CLASS_GRADES.flatMap((grade, gradeOffset) =>
  CLASS_SECTIONS.map((section, sectionOffset) => {
    const index = gradeOffset * CLASS_SECTIONS.length + sectionOffset + 1

    return {
      id: `cls_${index}`,
      schoolId: SCHOOL_ID,
      grade,
      section,
      academicYear: ACADEMIC_YEAR,
      // The teachers rotate, so every class has a homeroom teacher even though there are fewer
      // teachers than classes.
      classTeacherId: `tch_${((index - 1) % HOMEROOM_TEACHERS) + 1}`,
    }
  }),
)

/** The ids in grade/section order — both student seeds derive their class from this one list. */
export const classIds: string[] = classes.map((classRoom) => classRoom.id)

/**
 * Look a class up by the name it is spoken with, so seed data can say "class 5A" without knowing
 * which id that happens to be — the prose and the id cannot drift apart.
 */
export function classIdFor(grade: number, section: string): string {
  const classRoom = classes.find((room) => room.grade === grade && room.section === section)

  if (!classRoom) throw new Error(`No class ${grade}${section} exists`)

  return classRoom.id
}

export function classLabel(classRoom: ClassRoom): string {
  return `Class ${classRoom.grade}${classRoom.section}`
}

export function findClass(id: string | null): ClassRoom | undefined {
  return id ? classes.find((classRoom) => classRoom.id === id) : undefined
}
