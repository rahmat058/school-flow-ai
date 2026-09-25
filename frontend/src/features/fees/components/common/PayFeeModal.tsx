import { useId } from 'react'
import { Check } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { formatPaise } from '@/lib/format'
import { manualPaymentMethodOptions } from '@/lib/options'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { usePayMyInvoice } from '@/features/fees/api'
import type { PaymentMethod, Receipt, StudentDueRow } from '@/types/fees'

interface PayFeeModalProps {
  open: boolean
  onClose: () => void
  /** The demand being settled — supplies the amount and its ceiling. */
  due: StudentDueRow | null
  onPaid: (receipt: Receipt) => void
}

interface FormValues {
  amount: string
  method: string
  reference: string
  remarks: string
}

/**
 * The Pay Now form a student and a guardian share — both settle an invoice on their own account (a
 * guardian's child's, which the API validates). Deliberately a `Modal` rather than the app's usual
 * `Sheet`, matching the reference: every other create/edit form opens in a Sheet and only the receipt
 * preview is a Modal. Mounted with a key of the target invoice, so each demand opens with its own amount.
 */
export function PayFeeModal({ open, onClose, due, onPaid }: PayFeeModalProps) {
  const { toast } = useToast()
  const formId = useId()
  const payInvoice = usePayMyInvoice()
  const balance = due ? due.balancePaise / 100 : 0

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      amount: due ? String(balance) : '',
      method: 'ONLINE',
      reference: '',
      remarks: '',
    },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!due) return

    try {
      const receipt = await payInvoice.mutateAsync({
        invoiceId: due.invoiceId,
        amountPaise: Math.round(Number(values.amount) * 100),
        method: values.method as PaymentMethod,
        reference: values.reference.trim(),
        remarks: values.remarks.trim() || null,
      })

      toast({ tone: 'success', title: 'Payment successful', description: `Receipt ${receipt.receiptNo}` })
      onPaid(receipt)
      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not record this payment'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Payment failed', description: message })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pay Fee"
      description={due?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting || !due}>
            {isSubmitting ? (
              <Spinner size="sm" className="text-white" label="Paying" />
            ) : (
              <Check className="size-4" strokeWidth={2} />
            )}
            Confirm Payment
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        {due ? (
          <dl className="border-line bg-canvas grid grid-cols-3 gap-3 rounded-lg border p-3">
            <Summary label="Total" value={formatPaise(due.totalPaise)} />
            <Summary label="Paid" value={formatPaise(due.paidPaise)} tone="text-success" />
            <Summary label="Balance" value={formatPaise(due.balancePaise)} tone="text-error" />
          </dl>
        ) : null}

        <Input
          label="Amount to pay ($)"
          type="number"
          min={0.01}
          step="0.01"
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Enter the amount you are paying',
            validate: (value) => {
              const parsed = Number(value)
              if (parsed <= 0) return 'Enter an amount greater than zero'
              if (parsed > balance) return `The balance on this invoice is ${formatPaise(due?.balancePaise ?? 0)}`
              return true
            },
          })}
        />

        <Controller
          control={control}
          name="method"
          rules={{ required: 'Choose a payment mode' }}
          render={({ field }) => (
            <div>
              <p className="text-ink mb-1.5 text-[13px] font-medium">Payment mode</p>
              <MethodPicker value={field.value} onChange={field.onChange} />
              {errors.method?.message ? <p className="text-error mt-1.5 text-[12px]">{errors.method.message}</p> : null}
            </div>
          )}
        />

        <Input
          label="Transaction / UTR ID"
          placeholder="e.g. UPI ref / UTR number"
          error={errors.reference?.message}
          {...register('reference', { required: 'Enter the transaction / UTR id' })}
        />

        <Input label="Remarks (optional)" placeholder="Cheque no., note…" {...register('remarks')} />
      </form>
    </Modal>
  )
}

/** A segmented picker over `manualPaymentMethodOptions` — the reference's button group, not a Select. */
function MethodPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment mode">
      {manualPaymentMethodOptions.map((option) => {
        const selected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md border px-3 py-2 text-[13px] font-medium transition-colors',
              // The soft fill keeps the footer's Confirm Payment the section's only solid primary.
              selected
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-line text-ink hover:bg-primary-soft hover:text-primary',
            )}>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function Summary({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">{label}</dt>
      <dd className={cn('mt-0.5 text-[14px] font-semibold tabular-nums', tone)}>{value}</dd>
    </div>
  )
}
