import type {
  Concession,
  ConcessionCategory,
  ConcessionStatus,
  ConcessionType,
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

/** `2026` → `2026-27` — the label the fee titles read with. */
export const FEE_YEAR_LABEL = `${ACADEMIC_YEAR}-${String(Number(ACADEMIC_YEAR) + 1).slice(-2)}`

interface HeadTemplate {
  name: string
  amount: number
  frequency: FeeHead['frequency']
  dueOffset: number
  description: string | null
}

/**
 * What every class is charged. Due dates are relative to today so the demo never looks stale, and
 * they deliberately straddle the line: the first two fall in the past (settled or overdue), the last
 * two are still ahead (so a genuine `PENDING` exists alongside `OVERDUE`).
 */
const HEAD_TEMPLATES: HeadTemplate[] = [
  {
    name: `Admission & Development Fee (${FEE_YEAR_LABEL})`,
    amount: 320,
    frequency: 'ONE_TIME',
    dueOffset: -178,
    description: 'One-time admission and development charge.',
  },
  {
    name: `Tuition Fee — Quarter 1 (${FEE_YEAR_LABEL})`,
    amount: 450,
    frequency: 'QUARTERLY',
    dueOffset: -156,
    description: null,
  },
  {
    name: `Tuition Fee — Quarter 2 (${FEE_YEAR_LABEL})`,
    amount: 450,
    frequency: 'QUARTERLY',
    dueOffset: 22,
    description: null,
  },
  {
    name: 'Examination Fee — Half Yearly',
    amount: 80,
    frequency: 'ONE_TIME',
    dueOffset: 8,
    description: 'Half-yearly examination charge.',
  },
]

/** One structure per class, holding that class's heads. */
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
    dueDate: dateOffset(template.dueOffset),
    description: template.description,
  })),
)

export function findFeeHead(id: string | null): FeeHead | undefined {
  return id ? feeHeads.find((head) => head.id === id) : undefined
}

export function structureForClass(classId: string | null): FeeStructure {
  return feeStructures.find((structure) => structure.classId === classId) ?? feeStructures[0]
}

export function headsForStructure(structureId: string): FeeHead[] {
  return feeHeads.filter((head) => head.feeStructureId === structureId)
}

interface ConcessionSpec {
  studentOffset: number
  category: ConcessionCategory
  type: ConcessionType
  percentage: number | null
  amount: number | null
  /** Which head of the student's structure it discounts; `null` means the first tuition head. */
  headIndex: number | null
  reason: string
  status: ConcessionStatus
}

/** The discount register — every category and both discount types occur, so the UI has all states. */
const CONCESSION_SPECS: ConcessionSpec[] = [
  {
    studentOffset: 0,
    category: 'SIBLING',
    type: 'PERCENTAGE',
    percentage: 10,
    amount: null,
    headIndex: 1,
    reason: 'Sibling concession approved for 2026-27.',
    status: 'APPROVED',
  },
  {
    studentOffset: 3,
    category: 'MERIT',
    type: 'PERCENTAGE',
    percentage: 25,
    amount: null,
    headIndex: 1,
    reason: 'Merit concession approved for 2026-27.',
    status: 'APPROVED',
  },
  {
    studentOffset: 6,
    category: 'SC_ST',
    type: 'PERCENTAGE',
    percentage: 15,
    amount: null,
    headIndex: 1,
    reason: 'SC/ST concession approved for 2026-27.',
    status: 'APPROVED',
  },
  {
    studentOffset: 12,
    category: 'CUSTOM',
    type: 'PERCENTAGE',
    percentage: 15,
    amount: null,
    headIndex: 1,
    reason: 'Custom concession approved for 2026-27.',
    status: 'APPROVED',
  },
  {
    studentOffset: 16,
    category: 'CUSTOM',
    type: 'PERCENTAGE',
    percentage: 15,
    amount: null,
    headIndex: 1,
    reason: 'Custom concession approved for 2026-27.',
    status: 'APPROVED',
  },
  {
    studentOffset: 20,
    category: 'STAFF_WARD',
    type: 'PERCENTAGE',
    percentage: 15,
    amount: null,
    headIndex: 1,
    reason: 'Staff Ward concession approved for 2026-27.',
    status: 'APPROVED',
  },
  {
    studentOffset: 1,
    category: 'CUSTOM',
    type: 'FIXED',
    percentage: null,
    amount: 60,
    headIndex: 2,
    reason: 'Transport not availed for one term.',
    status: 'APPROVED',
  },
  {
    studentOffset: 8,
    category: 'MERIT',
    type: 'PERCENTAGE',
    percentage: 20,
    amount: null,
    headIndex: null,
    reason: 'Merit scholarship application under review.',
    status: 'PENDING',
  },
]

function concessionSpecFor(studentOffset: number, headIndex: number): ConcessionSpec | undefined {
  return CONCESSION_SPECS.find((spec) => spec.studentOffset === studentOffset && (spec.headIndex ?? 1) === headIndex)
}

function discountFor(studentOffset: number, headIndex: number, amountPaise: number): number {
  const spec = concessionSpecFor(studentOffset, headIndex)
  if (!spec || spec.status !== 'APPROVED') return 0

  if (spec.type === 'PERCENTAGE') return Math.round((amountPaise * (spec.percentage ?? 0)) / 100)
  return Math.min(amountPaise, dollars(spec.amount ?? 0))
}

/** Deterministic per (student, head) so the demo dataset is stable between loads. */
function statusFor(studentOffset: number, headIndex: number): InvoiceStatus {
  if (headIndex === 0) return studentOffset % 6 === 0 ? 'PARTIAL' : 'PAID'
  if (headIndex === 1) {
    if (studentOffset % 9 === 0) return 'OVERDUE'
    return studentOffset % 7 === 0 ? 'PARTIAL' : 'PAID'
  }
  if (headIndex === 2) return studentOffset % 3 === 0 ? 'PAID' : 'PENDING'
  return studentOffset % 2 === 0 ? 'PAID' : 'PENDING'
}

const METHOD_CYCLE: PaymentMethod[] = ['CASH', 'CARD', 'ONLINE', 'CHEQUE', 'DEMAND_DRAFT', 'MOBILE_BANKING']

const MANUAL_METHODS: PaymentMethod[] = ['CASH', 'CHEQUE', 'DEMAND_DRAFT']

function remarksFor(method: PaymentMethod): string | null {
  if (method === 'CHEQUE') return 'Cheque no. 004512'
  if (method === 'DEMAND_DRAFT') return 'DD no. 000871'
  if (method === 'CASH') return 'Counter collection'
  return null
}

interface InvoiceSeed {
  invoice: FeeInvoice
  payment: FeePayment | null
}

let receiptCounter = 0

/** One invoice per (student × head) — a demand, not a lump sum. */
const invoiceSeeds: InvoiceSeed[] = students.flatMap((student, studentOffset) => {
  const structure = structureForClass(student.classId)
  const classSeq = classes.findIndex((classRoom) => classRoom.id === structure.classId) + 1
  const heads = headsForStructure(structure.id)

  return heads.flatMap((head, headIndex) => {
    // A few students keep one head unbilled, so the collect page's `+ Invoice` action has something
    // real to do instead of being permanently disabled.
    if (headIndex === heads.length - 1 && studentOffset % 3 === 0) return []

    const status = statusFor(studentOffset, headIndex)
    const discountPaise = discountFor(studentOffset, headIndex, head.amountPaise)
    const netPaise = head.amountPaise - discountPaise
    const paidPaise = status === 'PAID' ? netPaise : status === 'PARTIAL' ? Math.round(netPaise / 2) : 0
    const settled = paidPaise > 0

    if (settled) receiptCounter += 1

    const invoice: FeeInvoice = {
      id: `inv_${student.id}_${headIndex + 1}`,
      schoolId: SCHOOL_ID,
      studentId: student.id,
      feeStructureId: structure.id,
      feeHeadId: head.id,
      amountPaise: head.amountPaise,
      discountPaise,
      paidPaise,
      dueDate: head.dueDate,
      status,
      receiptNo: settled
        ? `RCP-SCH-${ACADEMIC_YEAR}-${String(classSeq).padStart(4, '0')}-${String(receiptCounter).padStart(5, '0')}`
        : null,
      issuedAt: dateTimeOffset(-(70 - (studentOffset % 15)), 9, 30),
      notes: null,
    }

    const method = METHOD_CYCLE[(studentOffset + headIndex) % METHOD_CYCLE.length]
    const manual = MANUAL_METHODS.includes(method)

    const payment: FeePayment | null = settled
      ? {
          id: `pay_${invoice.id}`,
          schoolId: SCHOOL_ID,
          invoiceId: invoice.id,
          studentId: student.id,
          recordedById: manual ? 'usr_admin_1' : null,
          amountPaise: paidPaise,
          provider: manual ? 'MANUAL' : (studentOffset + headIndex) % 2 === 0 ? 'STRIPE' : 'SSLCOMMERZ',
          method,
          providerOrderId: manual ? null : `order_${invoice.id}`,
          providerTxnId: manual ? null : `txn_${invoice.id}`,
          status: 'PAID',
          paidAt: dateTimeOffset(-(40 - (studentOffset % 20)), 11, 15),
          remarks: remarksFor(method),
        }
      : null

    return { invoice, payment }
  })
})

export const feeInvoices: FeeInvoice[] = invoiceSeeds.map((seed) => seed.invoice)
export const feePayments: FeePayment[] = invoiceSeeds.flatMap((seed) => (seed.payment ? [seed.payment] : []))

export function findFeeInvoice(id: string | null): FeeInvoice | undefined {
  return id ? feeInvoices.find((invoice) => invoice.id === id) : undefined
}

export function findFeePayment(id: string | null): FeePayment | undefined {
  return id ? feePayments.find((payment) => payment.id === id) : undefined
}

export const concessions: Concession[] = CONCESSION_SPECS.map((spec, offset) => {
  const student = students[spec.studentOffset]
  const structure = structureForClass(student.classId)
  const head = headsForStructure(structure.id)[spec.headIndex ?? 1]

  return {
    id: `con_${offset + 1}`,
    schoolId: SCHOOL_ID,
    studentId: student.id,
    feeHeadId: head?.id ?? null,
    category: spec.category,
    type: spec.type,
    percentage: spec.percentage,
    amountPaise: spec.amount === null ? null : dollars(spec.amount),
    reason: spec.reason,
    status: spec.status,
    approvedById: spec.status === 'APPROVED' ? 'usr_admin_1' : null,
    approvedAt: spec.status === 'APPROVED' ? dateTimeOffset(-(50 - offset * 3)) : null,
  }
})
