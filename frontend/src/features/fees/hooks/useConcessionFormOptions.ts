import { useMemo } from 'react'
import { useFeeStructures, useStudentOptions } from '@/features/fees/api'

/**
 * The concession form's two dependent pickers: the student list, and the heads of whichever class the
 * chosen student is in. Kept out of the sheet so the sheet stays a form and nothing else.
 */
export function useConcessionFormOptions(studentId: string) {
  const students = useStudentOptions()
  const student = (students.data ?? []).find((option) => option.value === studentId)
  const structures = useFeeStructures(student?.classId ?? '')

  const headOptions = useMemo(
    () => [
      { value: '', label: 'All fee structures' },
      ...(structures.data?.[0]?.heads ?? []).map((head) => ({ value: head.id, label: head.name })),
    ],
    [structures.data],
  )

  const studentOptions = useMemo(
    () => [{ value: '', label: 'Choose a student' }, ...(students.data ?? [])],
    [students.data],
  )

  return { studentOptions, headOptions }
}
