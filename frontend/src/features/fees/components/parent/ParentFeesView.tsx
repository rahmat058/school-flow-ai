import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Receipt as ReceiptIcon, Wallet } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { StatGrid } from '@/features/dashboard/common/StatGrid'
import { cn } from '@/lib/cn'
import { formatPaise } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import { useCurrentSchool } from '@/features/school/api'
import { useMyFees } from '@/features/fees/api'
import { FeeMonthlyBreakdown } from '@/features/fees/components/parent/FeeMonthlyBreakdown'
import { FeeRecordsList } from '@/features/fees/components/parent/FeeRecordsList'
import { PayFeeModal } from '@/features/fees/components/common/PayFeeModal'
import { ReceiptModal } from '@/features/fees/components/common/ReceiptModal'
import type { StatMetric } from '@/types/dashboard'
import type { Receipt, StudentDueRow } from '@/types/fees'

/**
 * A guardian's view of one child's fee account — `GET /fees/me?studentId=`, the same self-scoped read
 * a student's own My Fees tab uses, so a guardian and their child can never be shown different
 * numbers. The four tiles and the progress bar come off the payload's own totals and counts, so the
 * screen never rolls up a list.
 */
export function ParentFeesView() {
  const [studentId, setStudentId] = useState('')
  const [payTarget, setPayTarget] = useState<StudentDueRow | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const fees = useMyFees(studentId)
  const school = useCurrentSchool()
  const data = fees.data

  if (fees.isError) {
    return (
      <Alert tone="error" title="Could not load your child's fees">
        {fees.error instanceof ApiError ? fees.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const { summary, counts } = data

  const stats: StatMetric[] = [
    {
      id: 'total-paid',
      label: 'Total Paid',
      value: formatPaise(summary.paidPaise),
      delta: `${counts.payments} ${counts.payments === 1 ? 'payment' : 'payments'}`,
      icon: CheckCircle2,
      iconTone: 'success',
    },
    {
      id: 'total-pending',
      label: 'Total Pending',
      value: formatPaise(summary.pendingPaise),
      delta: `${counts.dues} ${counts.dues === 1 ? 'due' : 'dues'}`,
      icon: Wallet,
      iconTone: 'warning',
    },
    {
      id: 'total-fees',
      label: 'Total Fees',
      value: formatPaise(summary.totalPaise),
      delta: `${counts.records} ${counts.records === 1 ? 'record' : 'records'}`,
      icon: ReceiptIcon,
      iconTone: 'primary',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: formatPaise(summary.overduePaise),
      delta: counts.overdue === 0 ? 'Nothing overdue' : `${counts.overdue} overdue`,
      icon: AlertTriangle,
      iconTone: summary.overduePaise > 0 ? 'error' : 'success',
    },
  ]

  // Only a guardian with more than one child has anything to switch between.
  const picker =
    data.students.length > 1 ? (
      <Select
        className="max-w-72"
        options={data.students.map((student) => ({
          value: student.id,
          label: student.meta ? `${student.label} · ${student.meta}` : student.label,
        }))}
        value={studentId || data.students[0].id}
        onValueChange={(value) => {
          setStudentId(value)
          // The turn of a child switches the whole account, so drop any open target with it.
          setPayTarget(null)
        }}
        aria-label="Choose a child"
      />
    ) : null

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Fee Details</h1>
          <p className="text-ink-muted text-[14px]">Complete fee structure and payment history for your child.</p>
        </div>

        <div className="border-line bg-surface flex items-center gap-3 rounded-xl border px-3 py-2 shadow-(--shadow-card)">
          <Avatar name={data.studentName} size="md" />
          <div className="min-w-0">
            <p className="text-ink truncate text-[13px] font-semibold">{data.studentName}</p>
            {data.className ? <p className="text-ink-muted text-[12px]">Class {data.className}</p> : null}
          </div>
        </div>
      </header>

      {picker}

      <StatGrid stats={stats} />

      <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
        <Progress
          label="Payment progress"
          showValue
          value={summary.progress}
          tone={summary.pendingPaise > 0 ? 'warning' : 'success'}
        />

        <dl className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Paid</dt>
            <dd className="text-success mt-0.5 text-[14px] font-semibold tabular-nums">
              {formatPaise(summary.paidPaise)}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Remaining</dt>
            <dd
              className={cn(
                'mt-0.5 text-[14px] font-semibold tabular-nums',
                summary.pendingPaise > 0 ? 'text-error' : 'text-ink',
              )}>
              {formatPaise(summary.pendingPaise)}
            </dd>
          </div>
        </dl>
      </article>

      <Tabs defaultValue="records">
        <TabList>
          <Tab value="records">Fee Records</Tab>
          <Tab value="months">Monthly Breakdown</Tab>
        </TabList>

        <TabPanel value="records">
          <FeeRecordsList records={data.records} className={data.className} onPay={setPayTarget} />
        </TabPanel>

        <TabPanel value="months">
          <FeeMonthlyBreakdown months={data.months} />
        </TabPanel>
      </Tabs>

      {/* Keyed on the invoice so each demand opens with its own amount, as the student's does. */}
      <PayFeeModal
        key={payTarget?.invoiceId ?? 'none'}
        open={payTarget !== null}
        due={payTarget}
        onClose={() => setPayTarget(null)}
        onPaid={setReceipt}
      />

      <ReceiptModal
        open={receipt !== null}
        receipt={receipt}
        schoolName={school.data?.name ?? ''}
        onClose={() => setReceipt(null)}
      />
    </div>
  )
}
