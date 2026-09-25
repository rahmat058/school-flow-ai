export type FeeFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME'
export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type PaymentProvider = 'STRIPE' | 'SSLCOMMERZ' | 'MANUAL'
export type PaymentMethod = 'CARD' | 'MOBILE_BANKING' | 'NET_BANKING' | 'CASH' | 'CHEQUE' | 'DEMAND_DRAFT' | 'ONLINE'
export type ConcessionType = 'PERCENTAGE' | 'FIXED'
export type ConcessionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ConcessionCategory = 'SIBLING' | 'MERIT' | 'SC_ST' | 'CUSTOM' | 'STAFF_WARD'
/** A class's collection state: `CLEAR` when nothing is owed, otherwise the invoice status. */
export type ClassFeeStatus = 'CLEAR' | InvoiceStatus

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
  /** Money is integer minor units — never a float. */
  amountPaise: number
  frequency: FeeFrequency
  /** ISO date the head falls due. */
  dueDate: string
  description: string | null
}

export interface FeeInvoice {
  id: string
  schoolId: string
  studentId: string
  feeStructureId: string
  /** The head this invoice was raised from — null for a lump-sum demand. */
  feeHeadId: string | null
  amountPaise: number
  discountPaise: number
  paidPaise: number
  /** ISO date. */
  dueDate: string
  status: InvoiceStatus
  receiptNo: string | null
  issuedAt: string | null
  notes: string | null
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
  /** Free-text reference — the cheque number, the transfer id. */
  remarks: string | null
}

export interface Concession {
  id: string
  schoolId: string
  studentId: string
  /** Null means the concession applies to every head in the student's structure. */
  feeHeadId: string | null
  category: ConcessionCategory
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
  /** The head title, or the structure name when the invoice has no head. */
  title: string
}

/** Collection totals for the fees dashboard's stat cards. */
export interface FeeCollectionSummary {
  collectedPaise: number
  thisMonthPaise: number
  pendingPaise: number
  concessionPaise: number
  overdueCount: number
  totalStudents: number
  paidStudents: number
  pendingStudents: number
}

/** A fee head with its class resolved, for the Fee structure table. */
export interface FeeHeadRow extends FeeHead {
  className: string
  structureName: string
  /** Inherited from the owning structure — the head does not carry its own year. */
  academicYear: string
}

/** A structure plus its heads and totals — what the Fee structure tab renders. */
export interface FeeStructureDetail extends FeeStructure {
  className: string
  heads: FeeHeadRow[]
  totalHeads: number
  totalAmountPaise: number
}

export interface PendingInvoiceRow {
  invoiceId: string
  studentId: string
  studentName: string
  className: string
  title: string
  dueDate: string
  amountPaise: number
  balancePaise: number
  status: InvoiceStatus
}

export interface FeeChartPoint {
  label: string
  value: number
}

export interface FeeTrendPoint {
  label: string
  collectedPaise: number
  pendingPaise: number
}

/** The fees dashboard's charts and defaulter list — the stat cards come from `/fees/summary`. */
export interface FeeDashboard {
  collectionTrend: FeeTrendPoint[]
  classCollection: FeeChartPoint[]
  pending: PendingInvoiceRow[]
}

/** The Collect fee tab's stat cards, scoped by the active class/status filters. */
export interface FeeCollectSummary {
  totalStudents: number
  paidStudents: number
  pendingStudents: number
  totalCollectedPaise: number
  totalPendingPaise: number
}

/** One row of the Collect fee tab's Class-wise Fee Status table. */
export interface ClassFeeStatusRow {
  studentId: string
  studentName: string
  className: string
  admissionNo: string
  totalDuePaise: number
  paidPaise: number
  pendingPaise: number
  status: InvoiceStatus
}

/** One outstanding (or partially paid) demand on the collect page. */
export interface StudentDueRow {
  invoiceId: string
  title: string
  totalPaise: number
  paidPaise: number
  balancePaise: number
  dueDate: string
  status: InvoiceStatus
}

/** A head from the student's structure that can still be turned into an invoice. */
export interface InvoiceCandidateRow {
  feeHeadId: string
  title: string
  grossPaise: number
  concessionPaise: number
  netPaise: number
  frequency: FeeFrequency
  hasInvoice: boolean
}

export interface PaymentHistoryRow {
  id: string
  receiptNo: string
  title: string
  amountPaise: number
  method: PaymentMethod
  paidAt: string
}

/** Everything the individual collect page renders, in one payload. */
export interface StudentCollectSummary {
  studentId: string
  studentName: string
  className: string
  admissionNo: string
  rollNo: number
  totalPaidPaise: number
  balancePaise: number
  dues: StudentDueRow[]
  invoiceCandidates: InvoiceCandidateRow[]
  payments: PaymentHistoryRow[]
}

/** A student's own totals — `paid + pending = total`, so the three tiles can never disagree. */
export interface StudentFeesSummary {
  paidPaise: number
  pendingPaise: number
  totalPaise: number
}

/**
 * `GET /fees/me` — the caller's own fees, resolved from the session. Deliberately narrower than
 * `StudentCollectSummary`: raising invoices is a staff action, so there are no candidates here.
 */
export interface StudentFeesOverview {
  studentName: string
  className: string
  admissionNo: string
  rollNo: number | null
  summary: StudentFeesSummary
  /** Outstanding and partially paid demands, soonest due first. */
  dues: StudentDueRow[]
  /** Settled payments, newest first. */
  payments: PaymentHistoryRow[]
}

/**
 * The student's own Pay Now form's payload. The UTR is stored on the payment's `providerTxnId`,
 * which is otherwise unused by the manual path.
 */
export interface StudentPaymentInput {
  invoiceId: string
  amountPaise: number
  method: PaymentMethod
  /** Transaction / UTR id. */
  reference: string
  remarks: string | null
}

export interface DayBookRow {
  id: string
  receiptNo: string
  studentName: string
  className: string
  title: string
  amountPaise: number
  method: PaymentMethod
  status: PaymentStatus
}

export interface DayBook {
  rows: DayBookRow[]
  count: number
  totalPaise: number
}

export interface ClassReportRow {
  studentId: string
  studentName: string
  rollNo: number
  totalInvoicedPaise: number
  totalPaidPaise: number
  balancePaise: number
  status: ClassFeeStatus
}

export interface DefaulterRow {
  studentId: string
  studentName: string
  className: string
  rollNo: number
  title: string
  duePaise: number
  dueDate: string
  status: InvoiceStatus
}

export interface StudentLedgerRow {
  id: string
  receiptNo: string | null
  title: string
  amountPaise: number
  paidPaise: number
  method: PaymentMethod | null
  dueDate: string
  paidAt: string | null
  status: InvoiceStatus
}

export interface StudentLedger {
  rows: StudentLedgerRow[]
  totalInvoicedPaise: number
  totalPaidPaise: number
  balancePaise: number
}

/** A concession with its student, head and computed discount resolved. */
export interface ConcessionRow extends Concession {
  studentName: string
  className: string
  feeHeadTitle: string | null
  /** `10%` or a flat amount, ready to render. */
  discountLabel: string
  effectivePaise: number
}

export interface ReceiptItem {
  title: string
  amountPaise: number
}

/** The printable receipt, derived from a payment and its invoice. */
export interface Receipt {
  receiptNo: string
  studentName: string
  className: string
  admissionNo: string
  rollNo: number
  paidAt: string
  items: ReceiptItem[]
  amountPaidPaise: number
  method: PaymentMethod
  reference: string | null
}

/** The Add / Edit Fee head form's payload. */
export interface FeeHeadInput {
  classId: string
  title: string
  amountPaise: number
  frequency: FeeFrequency
  dueDate: string
  academicYear: string
  description: string | null
}

/** The Add / Edit Concession form's payload. */
export interface ConcessionInput {
  studentId: string
  feeHeadId: string | null
  category: ConcessionCategory
  type: ConcessionType
  percentage: number | null
  amountPaise: number | null
  reason: string | null
}

/** The collect form's payload — a manual payment against one invoice. */
export interface PaymentInput {
  invoiceId: string
  amountPaise: number
  method: PaymentMethod
  remarks: string | null
}

/** The `+ Invoice` form's payload — raise one invoice from a fee head. */
export interface InvoiceInput {
  studentId: string
  feeHeadId: string
  dueDate: string
  notes: string | null
}
