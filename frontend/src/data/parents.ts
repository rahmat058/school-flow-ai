import type { Parent, ParentRelation, ParentStudentLink } from '@/types/people'
import { SCHOOL_DOMAIN, SCHOOL_ID, personName, schoolEmail } from '@/data/seed'

const OCCUPATIONS = [
  'Software engineer',
  'Doctor',
  'Bank officer',
  'Garment exporter',
  'University lecturer',
  'Civil engineer',
  'Pharmacist',
  'Business owner',
  'Government officer',
  'Architect',
  'Accountant',
  'Journalist',
]

const STREETS = [
  'House 12, Road 4, Dhanmondi',
  'Flat 3B, Gulshan Avenue',
  'House 27, Road 11, Banani',
  'Flat 5A, Uttara Sector 7',
  'House 9, Road 2, Mohammadpur',
  'Flat 2C, Bashundhara R/A',
  'House 44, Road 8, Mirpur',
  'Flat 6D, Banasree',
  'House 18, Road 5, Badda',
  'Flat 1A, Wari',
  'House 31, Road 3, Rampura',
  'Flat 4B, Shyamoli',
]

/** Twelve guardians; each is linked to two children (`std_n` and `std_{n+12}`). */
export const parents: Parent[] = Array.from({ length: 12 }, (_, offset) => {
  const index = offset + 1
  const { firstName, lastName } = personName(index)

  return {
    id: `par_${index}`,
    schoolId: SCHOOL_ID,
    userId: `usr_par_${index}`,
    firstName,
    lastName,
    email: schoolEmail(index, `parent.${SCHOOL_DOMAIN}`),
    phone: `+88018${(22000000 + index * 251).toString().slice(0, 8)}`,
    address: STREETS[offset],
    occupation: OCCUPATIONS[offset],
    status: 'ACTIVE',
  }
})

function relationFor(index: number): ParentRelation {
  if (index % 6 === 0) return 'GUARDIAN'
  return index % 2 === 0 ? 'MOTHER' : 'FATHER'
}

export const parentStudents: ParentStudentLink[] = parents.flatMap((parent, offset) => {
  const index = offset + 1
  const childIndexes = [index, index + 12]

  return childIndexes.map((childIndex, childOffset) => ({
    id: `psl_${index}_${childIndex}`,
    schoolId: SCHOOL_ID,
    parentId: parent.id,
    studentId: `std_${childIndex}`,
    relation: relationFor(index),
    isPrimary: childOffset === 0,
  }))
})

export function findParent(id: string): Parent | undefined {
  return parents.find((parent) => parent.id === id)
}
