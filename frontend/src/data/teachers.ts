import type { Teacher, TeacherClass } from '@/types/people'
import { SCHOOL_ID, dateOffset, personName } from '@/data/seed'
import { subjectTemplates } from '@/data/subjects'

const QUALIFICATIONS = [
  'M.Ed, University of Dhaka',
  'MSc Mathematics, BUET',
  'MA English, Jahangirnagar University',
  'BSc Physics, University of Chittagong',
  'MSc Computer Science, DU',
  'MA Bangla, Rajshahi University',
  'B.Ed, IER Dhaka',
  'MSc Chemistry, SUST',
]

const EXPERIENCE_YEARS = [12, 8, 15, 6, 10, 4, 18, 9]

/** Eight teachers; `tch_n` also owns class `cls_n` (see `data/classes.ts`). */
export const teachers: Teacher[] = Array.from({ length: 8 }, (_, offset) => {
  const index = offset + 1
  const { firstName, lastName } = personName(index)

  return {
    id: `tch_${index}`,
    schoolId: SCHOOL_ID,
    userId: `usr_tch_${index}`,
    employeeNo: `EMP-${index.toString().padStart(4, '0')}`,
    firstName,
    lastName,
    phone: `+88017${(11000000 + index * 137).toString().slice(0, 8)}`,
    qualification: QUALIFICATIONS[offset],
    // Drawn from the school's catalogue, never a second list of subject names.
    subject: subjectTemplates[offset % subjectTemplates.length].name,
    experienceYears: EXPERIENCE_YEARS[offset],
    joinedAt: dateOffset(-(400 + index * 45)),
    status: index === 8 ? 'INACTIVE' : 'ACTIVE',
  }
})

/**
 * Class assignments. Every teacher takes their homeroom class plus one more, which is what the
 * card's class chips and the form's "Assign classes" tags read.
 */
export const teacherClasses: TeacherClass[] = teachers.flatMap((teacher, offset) => {
  const index = offset + 1

  return [
    { teacherId: teacher.id, classId: `cls_${((index - 1) % 6) + 1}` },
    { teacherId: teacher.id, classId: `cls_${((index + 2) % 6) + 1}` },
  ]
})

export function findTeacher(id: string | null): Teacher | undefined {
  return id ? teachers.find((teacher) => teacher.id === id) : undefined
}
