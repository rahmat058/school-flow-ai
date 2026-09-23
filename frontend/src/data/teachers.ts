import type { Teacher } from '@/types/people'
import { SCHOOL_ID, dateOffset, personName } from '@/data/seed'

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
    joinedAt: dateOffset(-(400 + index * 45)),
    status: index === 8 ? 'INACTIVE' : 'ACTIVE',
  }
})

export function findTeacher(id: string | null): Teacher | undefined {
  return id ? teachers.find((teacher) => teacher.id === id) : undefined
}
