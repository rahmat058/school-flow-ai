import type { BloodGroup, Gender, Student } from '@/types/people'
import { SCHOOL_ID, dateOffset, personName } from '@/data/seed'
import { classIds, classes } from '@/data/classes'

const STUDENT_COUNT = 24

/** Spread across the blood groups deterministically, so the roster is stable between loads. */
const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function genderFor(index: number): Gender {
  if (index % 5 === 0) return 'OTHER'
  return index % 2 === 0 ? 'MALE' : 'FEMALE'
}

/**
 * Round robin over every class, so no class sits empty however many there are. `data/users.ts`
 * derives the same class for each student's login from the same list.
 */
function classIdFor(index: number): string {
  return classIds[(index - 1) % classIds.length]
}

/** The roll number restarts with each class: it is the student's position within theirs. */
function rollNoFor(index: number): number {
  return Math.floor((index - 1) / classIds.length) + 1
}

export const students: Student[] = Array.from({ length: STUDENT_COUNT }, (_, offset) => {
  const index = offset + 1
  const { firstName, lastName } = personName(index)
  const classRoom = classes.find((room) => room.id === classIdFor(index))

  return {
    id: `std_${index}`,
    schoolId: SCHOOL_ID,
    userId: `usr_std_${index}`,
    admissionNo: `ADM-${index.toString().padStart(4, '0')}`,
    firstName,
    lastName,
    // Age tracks the grade: grade 1 starts around six years old, rising a year per grade.
    dateOfBirth: dateOffset(-(365 * (5 + (classRoom?.grade ?? 1)) + 40 * index)),
    gender: genderFor(index),
    bloodGroup: BLOOD_GROUPS[(index - 1) % BLOOD_GROUPS.length],
    classId: classIdFor(index),
    rollNo: rollNoFor(index),
    status: 'ACTIVE',
  }
})

export function findStudent(id: string): Student | undefined {
  return students.find((student) => student.id === id)
}
