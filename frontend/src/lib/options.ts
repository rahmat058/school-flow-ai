import type { SubjectName } from '@/types/academic'
import type { HomeworkStatus } from '@/types/homework'
import type { BloodGroup, FeeStanding, Gender } from '@/types/people'
import type { ConcessionCategory, ConcessionType, FeeFrequency, InvoiceStatus, PaymentMethod } from '@/types/fees'

/** A select's list item. Structurally what `components/ui/Select` renders. */
export interface FieldOption {
  value: string
  label: string
}

/**
 * The school's class shape, shared by the seed and the UI: grades 1–10, each with an A and a B
 * section. `data/classes.ts` builds its rows from these, so the catalogue and the class list can
 * never disagree.
 */
export const CLASS_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export const CLASS_SECTIONS = ['A', 'B'] as const

/** The school's subjects — `data/subjects.ts` fans these across every class. */
export const SUBJECT_NAMES = [
  'English',
  'Mathematics',
  'Science',
  'Social Studies',
  'ICT',
  'Physical Education',
] as const satisfies readonly SubjectName[]

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

export const FEE_FREQUENCY_VALUES = [
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL',
  'ONE_TIME',
] as const satisfies readonly FeeFrequency[]

export const INVOICE_STATUS_VALUES = [
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE',
] as const satisfies readonly InvoiceStatus[]

export const FEE_STANDING_VALUES = ['PAID', 'UNPAID', 'OVERDUE'] as const satisfies readonly FeeStanding[]

export const MANUAL_PAYMENT_METHODS = [
  'CASH',
  'ONLINE',
  'CHEQUE',
  'DEMAND_DRAFT',
] as const satisfies readonly PaymentMethod[]

export const HOMEWORK_STATUS_VALUES = ['ACTIVE', 'OVERDUE'] as const satisfies readonly HomeworkStatus[]

export const CONCESSION_CATEGORY_VALUES = [
  'SIBLING',
  'MERIT',
  'SC_ST',
  'STAFF_WARD',
  'CUSTOM',
] as const satisfies readonly ConcessionCategory[]

export const CONCESSION_TYPE_VALUES = ['PERCENTAGE', 'FIXED'] as const satisfies readonly ConcessionType[]

const GENDER_LABELS: Record<Gender, string> = {
  FEMALE: 'Female',
  MALE: 'Male',
  OTHER: 'Other',
}

const FEE_FREQUENCY_LABELS: Record<FeeFrequency, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
  ONE_TIME: 'One-time',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
}

const FEE_STANDING_LABELS: Record<FeeStanding, string> = {
  PAID: 'Paid',
  UNPAID: 'Unpaid',
  OVERDUE: 'Overdue',
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: 'Card',
  MOBILE_BANKING: 'Mobile banking',
  NET_BANKING: 'Net banking',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  DEMAND_DRAFT: 'DD',
  ONLINE: 'Online',
}

const HOMEWORK_STATUS_LABELS: Record<HomeworkStatus, string> = {
  ACTIVE: 'Active',
  OVERDUE: 'Overdue',
}

export const CONCESSION_CATEGORY_LABELS: Record<ConcessionCategory, string> = {
  SIBLING: 'Sibling',
  MERIT: 'Merit',
  SC_ST: 'SC / ST',
  STAFF_WARD: 'Staff ward',
  CUSTOM: 'Custom',
}

const CONCESSION_TYPE_LABELS: Record<ConcessionType, string> = {
  PERCENTAGE: 'Percent (%)',
  FIXED: 'Flat ($)',
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

export const feeFrequencyOptions: FieldOption[] = FEE_FREQUENCY_VALUES.map((value) => ({
  value,
  label: FEE_FREQUENCY_LABELS[value],
}))

export const manualPaymentMethodOptions: FieldOption[] = MANUAL_PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}))

export const concessionCategoryOptions: FieldOption[] = CONCESSION_CATEGORY_VALUES.map((value) => ({
  value,
  label: CONCESSION_CATEGORY_LABELS[value],
}))

export const concessionTypeOptions: FieldOption[] = CONCESSION_TYPE_VALUES.map((value) => ({
  value,
  label: CONCESSION_TYPE_LABELS[value],
}))

export const invoiceStatusOptions: FieldOption[] = [
  { value: '', label: 'All status' },
  ...INVOICE_STATUS_VALUES.map((value) => ({ value, label: INVOICE_STATUS_LABELS[value] })),
]

export const feeStandingOptions: FieldOption[] = [
  { value: '', label: 'All fee status' },
  ...FEE_STANDING_VALUES.map((value) => ({ value, label: FEE_STANDING_LABELS[value] })),
]

export const homeworkStatusOptions: FieldOption[] = [
  { value: '', label: 'All status' },
  ...HOMEWORK_STATUS_VALUES.map((value) => ({ value, label: HOMEWORK_STATUS_LABELS[value] })),
]
