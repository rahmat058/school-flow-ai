import { formatDate, formatPaise, humanizeEnum } from '@/lib/format'
import type { Receipt } from '@/types/fees'

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildReceiptDocument(receipt: Receipt, schoolName: string): string {
  const items = receipt.items
    .map(
      (item) => `<tr><td>${escapeHtml(item.title)}</td><td class="amount">${formatPaise(item.amountPaise)}</td></tr>`,
    )
    .join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(receipt.receiptNo)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; color: #0a0a0a; margin: 0; padding: 32px; }
      .sheet { max-width: 640px; margin: 0 auto; border: 1px solid #e8e8ec; border-radius: 12px; padding: 32px; }
      .brand { font-size: 20px; font-weight: 600; color: #6366f1; margin: 0; }
      .subtitle { color: #6b6b6b; font-size: 13px; margin: 4px 0 24px; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; margin-bottom: 24px; }
      .meta span { color: #6b6b6b; }
      .meta strong { font-weight: 500; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th { text-align: left; color: #9c9c9c; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 0; border-bottom: 1px solid #e8e8ec; }
      td { padding: 10px 0; border-bottom: 1px solid #e8e8ec; }
      .amount, th.amount { text-align: right; }
      .total td { font-weight: 600; }
      .total .amount { color: #10b981; }
      .footer { display: flex; gap: 24px; font-size: 13px; color: #6b6b6b; margin-top: 20px; }
      .note { text-align: center; color: #9c9c9c; font-size: 12px; margin-top: 28px; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <p class="brand">${escapeHtml(schoolName)}</p>
      <p class="subtitle">Fee Payment Receipt</p>

      <div class="meta">
        <div><span>Receipt No</span><br /><strong>${escapeHtml(receipt.receiptNo)}</strong></div>
        <div><span>Date</span><br /><strong>${formatDate(receipt.paidAt, 'dd MMM yyyy')}</strong></div>
        <div><span>Student</span><br /><strong>${escapeHtml(receipt.studentName)}</strong></div>
        <div><span>Student ID</span><br /><strong>${escapeHtml(receipt.admissionNo)}</strong></div>
        <div><span>Class</span><br /><strong>${escapeHtml(receipt.className)}</strong></div>
        <div><span>Roll No</span><br /><strong>${receipt.rollNo}</strong></div>
      </div>

      <table>
        <thead>
          <tr><th>Description</th><th class="amount">Amount</th></tr>
        </thead>
        <tbody>
          ${items}
          <tr class="total"><td>Amount Paid</td><td class="amount">${formatPaise(receipt.amountPaidPaise)}</td></tr>
        </tbody>
      </table>

      <div class="footer">
        <div><span>Mode</span><br /><strong>${humanizeEnum(receipt.method)}</strong></div>
        <div><span>Ref</span><br /><strong>${escapeHtml(receipt.reference ?? '—')}</strong></div>
      </div>

      <p class="note">Computer-generated receipt — no signature required</p>
    </div>
  </body>
</html>`
}

/**
 * Prints only the receipt, through a throwaway iframe, so the surrounding app page is never part of
 * the document that reaches the printer.
 */
export function printReceipt(receipt: Receipt, schoolName: string): void {
  const frame = document.createElement('iframe')

  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.appendChild(frame)

  const frameWindow = frame.contentWindow
  if (!frameWindow) {
    frame.remove()
    return
  }

  frameWindow.document.open()
  frameWindow.document.write(buildReceiptDocument(receipt, schoolName))
  frameWindow.document.close()
  frameWindow.focus()
  frameWindow.print()

  window.setTimeout(() => frame.remove(), 1000)
}
