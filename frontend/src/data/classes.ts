import type { ClassRoom } from '@/types/academic'
import { ACADEMIC_YEAR, SCHOOL_ID } from '@/data/seed'

function buildClass(index: number, grade: number, section: string): ClassRoom {
  return {
    id: `cls_${index}`,
    schoolId: SCHOOL_ID,
    grade,
    section,
    academicYear: ACADEMIC_YEAR,
    classTeacherId: `tch_${index}`,
  }
}

/** Six classes: 5A, 5B, 6A, 6B, 7A, 7B — one class teacher each. */
export const classes: ClassRoom[] = [
  buildClass(1, 5, 'A'),
  buildClass(2, 5, 'B'),
  buildClass(3, 6, 'A'),
  buildClass(4, 6, 'B'),
  buildClass(5, 7, 'A'),
  buildClass(6, 7, 'B'),
]

export function classLabel(classRoom: ClassRoom): string {
  return `Class ${classRoom.grade}${classRoom.section}`
}

export function findClass(id: string | null): ClassRoom | undefined {
  return id ? classes.find((classRoom) => classRoom.id === id) : undefined
}
