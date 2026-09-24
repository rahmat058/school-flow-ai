import type { BloodGroup, Gender } from '@/types/people'

/** A select's list item. Structurally what `components/ui/Select` renders. */
export interface FieldOption {
  value: string
  label: string
}

/**
 * Option lists derived from the domain types rather than retyped in each form: the `satisfies`
 * check means adding a member to a union without offering it here is a compile error, not a
 * select that quietly omits a value.
 */

export const BLOOD_GROUP_VALUES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const satisfies readonly BloodGroup[]

export const GENDER_VALUES = ['FEMALE', 'MALE', 'OTHER'] as const satisfies readonly Gender[]

const GENDER_LABELS: Record<Gender, string> = {
  FEMALE: 'Female',
  MALE: 'Male',
  OTHER: 'Other',
}

/** The empty value is the unset state the API accepts for a nullable field. */
export const bloodGroupOptions: FieldOption[] = [
  { value: '', label: 'Choose a group' },
  ...BLOOD_GROUP_VALUES.map((group) => ({ value: group, label: group })),
]

export const genderOptions: FieldOption[] = [
  { value: '', label: 'Not specified' },
  ...GENDER_VALUES.map((gender) => ({ value: gender, label: GENDER_LABELS[gender] })),
]
