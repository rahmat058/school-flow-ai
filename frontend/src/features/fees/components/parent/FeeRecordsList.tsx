import { useState } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { formatDate, formatPaise } from '@/lib/format'
import { invoiceStatusOptions } from '@/lib/options'
import type { InvoiceStatus, StudentFeeRecordRow } from '@/types/fees'

interface FeeRecordsListProps {
  records: StudentFeeRecordRow[]
  /** The child's class label, which the section heading names. */
  className: string
  onPay: (record: StudentFeeRecordRow) => void
}

/**
 * Every invoice raised against the child, soonest due first. The status filter narrows what is
 * **already loaded** — the payload's totals stay the whole account, so filtering never moves a
 * headline figure (the same call the chat list's search makes). A row with a balance carries the
 * Pay Now action; a settled one does not.
 */
export function FeeRecordsList({ records, className, onPay }: FeeRecordsListProps) {
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const rows = status ? records.filter((record) => record.status === status) : records

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">
            Fee records — Class {className}
          </h2>
          <p className="text-ink-muted mt-1 text-[13px]">
            {rows.length} of {records.length} {records.length === 1 ? 'record' : 'records'}
          </p>
        </div>

        <Select
          className="max-w-45"
          options={invoiceStatusOptions}
          value={status}
          onValueChange={(value) => setStatus(value as InvoiceStatus | '')}
          aria-label="Filter by status"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">No fee records match this filter.</p>
      ) : (
        <ul className="divide-line divide-y">
          {rows.map((record) => {
            const settled = record.balancePaise === 0
            const Icon = settled ? CheckCircle2 : Clock

            return (
              <li key={record.invoiceId} className="flex flex-wrap items-center gap-4 py-4">
                <span
                  className={cn(
                    'inline-flex size-9 shrink-0 items-center justify-center rounded-lg',
                    settled ? 'bg-success-soft text-success' : 'bg-orange-soft text-warning',
                  )}>
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-[14px] font-semibold">{record.title}</p>
                  <p className="text-ink-muted mt-0.5 truncate text-[12px]">
                    Due {formatDate(record.dueDate, 'dd MMM yyyy')}
                    {record.paidOn ? ` · Paid on ${formatDate(record.paidOn, 'dd MMM yyyy')}` : ''}
                    {record.receiptNo ? ` · ${record.receiptNo}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-4">
                  <div className="text-right">
                    <p className="text-ink text-[13px] font-semibold tabular-nums">{formatPaise(record.totalPaise)}</p>
                    {record.paidPaise > 0 && record.balancePaise > 0 ? (
                      <p className="text-ink-subtle mt-0.5 text-[12px] tabular-nums">
                        Paid {formatPaise(record.paidPaise)} · Due {formatPaise(record.balancePaise)}
                      </p>
                    ) : null}
                  </div>

                  <StatusBadge status={record.status} />

                  {record.balancePaise > 0 ? (
                    <Button size="sm" onClick={() => onPay(record)}>
                      Pay Now
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
