import type { Gender, Student } from '@/types/people'
import { SCHOOL_ID, dateOffset, personName } from '@/data/seed'

const STUDENT_COUNT = 24
const CLASSES = ['cls_1', 'cls_2', 'cls_3', 'cls_4', 'cls_5', 'cls_6']

function genderFor(index: number): Gender {
  if (index % 5 === 0) return 'OTHER'
  return index % 2 === 0 ? 'MALE' : 'FEMALE'
}

/** Four students per class, in class order — matches the `classId` derivation in `data/users.ts`. */
export const students: Student[] = Array.from({ length: STUDENT_COUNT }, (_, offset) => {
  const index = offset + 1
  const { firstName, lastName } = personName(index)

  return {
    id: `std_${index}`,
    schoolId: SCHOOL_ID,
    userId: `usr_std_${index}`,
    admissionNo: `ADM-${index.toString().padStart(4, '0')}`,
    firstName,
    lastName,
    // Class 5 cohort is roughly 11 years old, rising by a year per grade.
    dateOfBirth: dateOffset(-(365 * (10 + Math.floor((index - 1) / 8)) + 40 * index)),
    gender: genderFor(index),
    classId: CLASSES[Math.floor((index - 1) / 4)],
    // Four students per class, so the roll number restarts with each class at 1.
    rollNo: (offset % 4) + 1,
    status: 'ACTIVE',
  }
})

export function findStudent(id: string): Student | undefined {
  return students.find((student) => student.id === id)
}
