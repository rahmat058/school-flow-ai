import type {
  Concession,
  FeeHead,
  FeeInvoice,
  FeePayment,
  FeeStructure,
  InvoiceStatus,
  PaymentMethod,
} from '@/types/fees'
import { ACADEMIC_YEAR, SCHOOL_ID, dateOffset, dateTimeOffset, dollars } from '@/data/seed'
import { classLabel, classes } from '@/data/classes'
import { students } from '@/data/students'

interface HeadTemplate {
  name: string
  amount: number
  frequency: FeeHead['frequency']
}

const HEAD_TEMPLATES: HeadTemplate[] = [
  { name: 'Tuition', amount: 450, frequency: 'MONTHLY' },
  { name: 'Transport', amount: 120, frequency: 'MONTHLY' },
  { name: 'Laboratory', amount: 250, frequency: 'QUARTERLY' },
  { name: 'Examination', amount: 80, frequency: 'ANNUAL' },
]

export const feeStructures: FeeStructure[] = classes.map((classRoom, offset) => ({
  id: `fst_${offset + 1}`,
  schoolId: SCHOOL_ID,
  classId: classRoom.id,
  academicYear: ACADEMIC_YEAR,
  name: `Class ${classLabel(classRoom)} — ${ACADEMIC_YEAR}`,
}))

export const feeHeads: FeeHead[] = feeStructures.flatMap((structure, structureOffset) =>
  HEAD_TEMPLATES.map((template, headOffset) => ({
    id: `fhd_${structureOffset + 1}_${headOffset + 1}`,
    schoolId: SCHOOL_ID,
    feeStructureId: structure.id,
    name: template.name,
    amountPaise: dollars(template.amount),
    frequency: template.frequency,
  })),
)

/** Invoice total is the sum of its structure's heads — the model, not a magic number. */
function amountForStructure(structureId: string): number {
  return feeHeads
    .filter((head) => head.feeStructureId === structureId)
    .reduce((total, head) => total + head.amountPaise, 0)
}

function structureForClass(classId: string | null): FeeStructure {
  return feeStructures.find((structure) => structure.classId === classId) ?? feeStructures[0]
}

const TERM_ONE_STATUS: InvoiceStatus[] = ['PAID', 'PAID', 'PARTIAL', 'PENDING', 'OVERDUE']

function receiptNumber(sequence: number): string {
  return `RCP-${ACADEMIC_YEAR}-${sequence.toString().padStart(5, '0')}`
}

interface InvoiceSeed {
  invoice: FeeInvoice
  payment: FeePayment | null
}

/** Two invoices per student: a settled-or-overdue first term and an upcoming second term. */
const invoiceSeeds: InvoiceSeed[] = students.flatMap((student, studentOffset) => {
  const structure = structureForClass(student.classId)
  const amountPaise = amountForStructure(structure.id)
  const termOneStatus = TERM_ONE_STATUS[studentOffset % TERM_ONE_STATUS.length]
  const termTwoStatus: InvoiceStatus = studentOffset % 3 === 0 ? 'PAID' : 'PENDING'

  const terms: Array<{ id: string; status: InvoiceStatus; dueDate: string; sequence: number }> = [
    { id: `inv_${student.id}_1`, status: termOneStatus, dueDate: dateOffset(-30), sequence: studentOffset * 2 + 1 },
    { id: `inv_${student.id}_2`, status: termTwoStatus, dueDate: dateOffset(15), sequence: studentOffset * 2 + 2 },
  ]

  return terms.map((term) => {
    const discountPaise = studentOffset % 7 === 0 ? dollars(50) : 0
    const netAmount = amountPaise - discountPaise
    const paidPaise = term.status === 'PAID' ? netAmount : term.status === 'PARTIAL' ? Math.round(netAmount / 2) : 0
    const settled = paidPaise > 0

    const invoice: FeeInvoice = {
      id: term.id,
      schoolId: SCHOOL_ID,
      studentId: student.id,
      feeStructureId: structure.id,
      amountPaise,
      discountPaise,
      paidPaise,
      dueDate: term.dueDate,
      status: term.status,
      receiptNo: settled ? receiptNumber(term.sequence) : null,
      issuedAt: dateTimeOffset(-(40 - (studentOffset % 10))),
    }

    const method: PaymentMethod = studentOffset % 3 === 0 ? 'CASH' : studentOffset % 3 === 1 ? 'CARD' : 'MOBILE_BANKING'
    const payment: FeePayment | null = settled
      ? {
          id: `pay_${term.id}`,
          schoolId: SCHOOL_ID,
          invoiceId: invoice.id,
          studentId: student.id,
          recordedById: method === 'CASH' ? 'usr_admin_1' : null,
          amountPaise: paidPaise,
          provider: method === 'CASH' ? 'MANUAL' : studentOffset % 2 === 0 ? 'STRIPE' : 'SSLCOMMERZ',
          method,
          providerOrderId: method === 'CASH' ? null : `order_${term.sequence.toString().padStart(6, '0')}`,
          providerTxnId: method === 'CASH' ? null : `txn_${term.sequence.toString().padStart(6, '0')}`,
          status: 'PAID',
          paidAt: dateTimeOffset(-(28 - (studentOffset % 12)), 11, 20),
        }
      : null

    return { invoice, payment }
  })
})

export const feeInvoices: FeeInvoice[] = invoiceSeeds.map((seed) => seed.invoice)
export const feePayments: FeePayment[] = invoiceSeeds
  .map((seed) => seed.payment)
  .filter((payment): payment is FeePayment => payment !== null)

export const concessions: Concession[] = [
  {
    id: 'con_1',
    schoolId: SCHOOL_ID,
    studentId: 'std_1',
    feeHeadId: 'fhd_1_1',
    type: 'PERCENTAGE',
    percentage: 25,
    amountPaise: null,
    reason: 'Sibling discount',
    status: 'APPROVED',
    approvedById: 'usr_admin_1',
    approvedAt: dateTimeOffset(-45),
  },
  {
    id: 'con_2',
    schoolId: SCHOOL_ID,
    studentId: 'std_7',
    feeHeadId: 'fhd_2_2',
    type: 'FIXED',
    percentage: null,
    amountPaise: dollars(60),
    reason: 'Transport not availed for one month',
    status: 'APPROVED',
    approvedById: 'usr_admin_1',
    approvedAt: dateTimeOffset(-20),
  },
  {
    id: 'con_3',
    schoolId: SCHOOL_ID,
    studentId: 'std_14',
    feeHeadId: null,
    type: 'PERCENTAGE',
    percentage: 50,
    amountPaise: null,
    reason: 'Merit scholarship application',
    status: 'PENDING',
    approvedById: null,
    approvedAt: null,
  },
]
