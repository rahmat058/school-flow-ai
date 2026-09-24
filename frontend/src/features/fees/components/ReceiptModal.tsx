import { Printer, ReceiptIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { formatDate, formatPaise, humanizeEnum } from '@/lib/format'
import { printReceipt } from '@/features/fees/lib/receipt'
import type { Receipt } from '@/types/fees'

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  receipt: Receipt | null
  schoolName: string
}

/** The receipt preview. Printing goes through `printReceipt`, so only the receipt reaches the printer. */
export function ReceiptModal({ open, onClose, receipt, schoolName }: ReceiptModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Payment receipt"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button disabled={!receipt} onClick={() => receipt && printReceipt(receipt, schoolName)}>
            <Printer className="size-4" strokeWidth={1.75} />
            Print receipt
          </Button>
        </>
      }>
      {receipt ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="bg-primary-soft text-primary flex size-9 items-center justify-center rounded-lg">
              <ReceiptIcon className="size-4.5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-primary text-[15px] font-semibold">{schoolName}</p>
              <p className="text-ink-muted text-[12px]">Fee Payment Receipt</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            <Detail label="Receipt no" value={receipt.receiptNo} mono />
            <Detail label="Date" value={formatDate(receipt.paidAt, 'dd MMM yyyy')} />
            <Detail label="Student" value={receipt.studentName} />
            <Detail label="Student ID" value={receipt.admissionNo} mono />
            <Detail label="Class" value={receipt.className} />
            <Detail label="Roll no" value={String(receipt.rollNo)} />
          </dl>

          <div className="border-line overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Description</TableHead>
                  <TableHead align="right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.items.map((item) => (
                  <TableRow key={item.title} className="hover:bg-transparent">
                    <TableCell className="text-[13px]">{item.title}</TableCell>
                    <TableCell align="right" className="tabular-nums">
                      {formatPaise(item.amountPaise)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary-soft/40 hover:bg-primary-soft/40">
                  <TableCell className="text-[13px] font-medium">Amount paid</TableCell>
                  <TableCell align="right" className="text-success font-medium tabular-nums">
                    {formatPaise(receipt.amountPaidPaise)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
            <Detail label="Mode" value={humanizeEnum(receipt.method)} />
            <Detail label="Ref" value={receipt.reference ?? '—'} />
          </div>

          <p className="text-ink-subtle text-center text-[12px]">Computer-generated receipt — no signature required</p>
        </div>
      ) : null}
    </Modal>
  )
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">{label}</dt>
      <dd className={`text-ink mt-0.5 truncate ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</dd>
    </div>
  )
}
