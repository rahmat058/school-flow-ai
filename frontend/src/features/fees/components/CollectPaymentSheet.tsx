import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { formatPaise } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import { useRecordPayment } from '@/features/fees/api'
import type { PaymentMethod, Receipt, StudentDueRow } from '@/types/fees'

const METHOD_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'DEMAND_DRAFT', label: 'DD' },
]

interface CollectPaymentSheetProps {
  open: boolean
  onClose: () => void
  /** The demand being settled — supplies the amount and its ceiling. */
  due: StudentDueRow | null
  studentName: string
  onRecorded: (receipt: Receipt) => void
}

interface FormValues {
  amount: string
  method: string
  remarks: string
}

/** Records a manual payment against one invoice, then hands the receipt back for printing. */
export function CollectPaymentSheet({ open, onClose, due, studentName, onRecorded }: CollectPaymentSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const recordPayment = useRecordPayment()
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
      method: 'CASH',
      remarks: '',
    },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!due) return

    try {
      const receipt = await recordPayment.mutateAsync({
        invoiceId: due.invoiceId,
        amountPaise: Math.round(Number(values.amount) * 100),
        method: values.method as PaymentMethod,
        remarks: values.remarks.trim() || null,
      })

      toast({ tone: 'success', title: 'Payment recorded', description: `Receipt ${receipt.receiptNo}` })
      onRecorded(receipt)
      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not record this payment'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Payment failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={due ? `Collect — ${due.title}` : 'Collect payment'}
      description={
        due ? `${studentName} · ${formatPaise(due.balancePaise)} outstanding` : 'Choose a demand to collect against.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting || !due}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Recording" /> : null}
            Confirm & record
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <Input
          label="Amount paying ($)"
          type="number"
          min={0.01}
          step="0.01"
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Enter the amount being paid',
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
            <Select
              label="Payment mode"
              options={METHOD_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.method?.message}
            />
          )}
        />

        <Input label="Remarks (optional)" placeholder="Cheque no., reference…" {...register('remarks')} />
      </form>
    </Sheet>
  )
}
