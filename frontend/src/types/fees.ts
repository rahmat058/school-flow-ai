export type FeeFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME'
export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type PaymentProvider = 'STRIPE' | 'SSLCOMMERZ' | 'MANUAL'
export type PaymentMethod = 'CARD' | 'MOBILE_BANKING' | 'NET_BANKING' | 'CASH' | 'CHEQUE'
export type ConcessionType = 'PERCENTAGE' | 'FIXED'
export type ConcessionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface FeeStructure {
  id: string
  schoolId: string
  classId: string
  academicYear: string
  name: string
}

export interface FeeHead {
  id: string
  schoolId: string
  feeStructureId: string
  name: string
  /** Money is integer paise — never a float. */
  amountPaise: number
  frequency: FeeFrequency
}

export interface FeeInvoice {
  id: string
  schoolId: string
  studentId: string
  feeStructureId: string
  amountPaise: number
  discountPaise: number
  paidPaise: number
  /** ISO date. */
  dueDate: string
  status: InvoiceStatus
  receiptNo: string | null
  issuedAt: string | null
}

export interface FeePayment {
  id: string
  schoolId: string
  invoiceId: string
  studentId: string
  recordedById: string | null
  amountPaise: number
  provider: PaymentProvider
  method: PaymentMethod
  providerOrderId: string | null
  providerTxnId: string | null
  status: PaymentStatus
  paidAt: string | null
}

export interface Concession {
  id: string
  schoolId: string
  studentId: string
  feeHeadId: string | null
  type: ConcessionType
  percentage: number | null
  amountPaise: number | null
  reason: string | null
  status: ConcessionStatus
  approvedById: string | null
  approvedAt: string | null
}

/** Read model for the invoices table — invoice plus its joined student and class. */
export interface FeeInvoiceListItem extends FeeInvoice {
  studentName: string
  admissionNo: string
  className: string
}

export interface FeeCollectionSummary {
  collectedPaise: number
  pendingPaise: number
  overdueCount: number
  concessionPaise: number
}
