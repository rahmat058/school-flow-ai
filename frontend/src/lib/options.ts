import type { NoticePriority } from '@/types/communication'
import type { ExamKind, ExamType } from '@/types/exams'
import type { HomeworkStatus } from '@/types/homework'
import type { MaterialType } from '@/types/materials'
import type { BloodGroup, FeeStanding, Gender } from '@/types/people'
import type { ConcessionCategory, ConcessionType, FeeFrequency, InvoiceStatus, PaymentMethod } from '@/types/fees'
import type { GradingScale, TermStructure } from '@/types/school'

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

/** Short month names, index 0 = January — the reports' month picker and the fee trend's axis. */
export const MONTH_LABELS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

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

export const MATERIAL_TYPE_VALUES = ['PDF', 'NOTES', 'WORKSHEET', 'PAPER'] as const satisfies readonly MaterialType[]

export const NOTICE_PRIORITY_VALUES = ['HIGH', 'MEDIUM', 'LOW'] as const satisfies readonly NoticePriority[]

export const EXAM_TYPE_VALUES = ['UNIT', 'MID', 'FINAL', 'ANNUAL'] as const satisfies readonly ExamType[]

export const EXAM_KIND_VALUES = ['TEST', 'EXAM'] as const satisfies readonly ExamKind[]

export const CONCESSION_CATEGORY_VALUES = [
  'SIBLING',
  'MERIT',
  'SC_ST',
  'STAFF_WARD',
  'CUSTOM',
] as const satisfies readonly ConcessionCategory[]

export const CONCESSION_TYPE_VALUES = ['PERCENTAGE', 'FIXED'] as const satisfies readonly ConcessionType[]

export const GRADING_SCALE_VALUES = ['PERCENTAGE', 'LETTER', 'GPA'] as const satisfies readonly GradingScale[]

export const TERM_STRUCTURE_VALUES = ['SEMESTER', 'TRIMESTER', 'ANNUAL'] as const satisfies readonly TermStructure[]

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

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  PDF: 'PDF',
  NOTES: 'Notes',
  WORKSHEET: 'Worksheet',
  PAPER: 'Previous-year paper',
}

const NOTICE_PRIORITY_LABELS: Record<NoticePriority, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  UNIT: 'Unit',
  MID: 'Mid-term',
  FINAL: 'Final',
  ANNUAL: 'Annual',
}

const EXAM_KIND_LABELS: Record<ExamKind, string> = {
  TEST: 'Test',
  EXAM: 'Scheduled exam',
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

const GRADING_SCALE_LABELS: Record<GradingScale, string> = {
  PERCENTAGE: 'Percentage (0-100%)',
  LETTER: 'Letter grade (A-F)',
  GPA: 'GPA (4.0)',
}

const TERM_STRUCTURE_LABELS: Record<TermStructure, string> = {
  SEMESTER: 'Semester (2 terms)',
  TRIMESTER: 'Trimester (3 terms)',
  ANNUAL: 'Annual (1 term)',
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

export const noticePriorityOptions: FieldOption[] = NOTICE_PRIORITY_VALUES.map((value) => ({
  value,
  label: NOTICE_PRIORITY_LABELS[value],
}))

export const examTypeOptions: FieldOption[] = EXAM_TYPE_VALUES.map((value) => ({
  value,
  label: EXAM_TYPE_LABELS[value],
}))

export const examKindOptions: FieldOption[] = EXAM_KIND_VALUES.map((value) => ({
  value,
  label: EXAM_KIND_LABELS[value],
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

export const materialTypeOptions: FieldOption[] = MATERIAL_TYPE_VALUES.map((value) => ({
  value,
  label: MATERIAL_TYPE_LABELS[value],
}))

export const materialTypeFilterOptions: FieldOption[] = [{ value: '', label: 'All types' }, ...materialTypeOptions]

/** The reports' month picker — the value is the 1-based month the API takes. */
export const monthOptions: FieldOption[] = MONTH_LABELS_SHORT.map((label, offset) => ({
  value: String(offset + 1),
  label,
}))

export const gradingScaleOptions: FieldOption[] = GRADING_SCALE_VALUES.map((value) => ({
  value,
  label: GRADING_SCALE_LABELS[value],
}))

export const termStructureOptions: FieldOption[] = TERM_STRUCTURE_VALUES.map((value) => ({
  value,
  label: TERM_STRUCTURE_LABELS[value],
}))

/**
 * The academic years offered around the one in force, so the picker always contains the current
 * value and never dead-ends. Years read bare (`2026`), matching the year every record stores.
 */
export function academicYearOptions(current: string): FieldOption[] {
  const base = Number(current) || new Date().getFullYear()
  return [base - 1, base, base + 1, base + 2].map((year) => ({ value: String(year), label: String(year) }))
}
