import { useId } from 'react'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { formatPaise } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import { useCreateInvoice } from '@/features/fees/api'
import type { InvoiceCandidateRow } from '@/types/fees'

interface InvoiceSheetProps {
  open: boolean
  onClose: () => void
  studentId: string
  /** The fee head the invoice is raised from. */
  candidate: InvoiceCandidateRow | null
}

interface FormValues {
  dueDate: string
  notes: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Raises one invoice for a student from a head of their class's structure. */
export function InvoiceSheet({ open, onClose, studentId, candidate }: InvoiceSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const createInvoice = useCreateInvoice()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { dueDate: today(), notes: '' },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!candidate) return

    try {
      await createInvoice.mutateAsync({
        studentId,
        feeHeadId: candidate.feeHeadId,
        dueDate: values.dueDate,
        notes: values.notes.trim() || null,
      })

      toast({ tone: 'success', title: 'Invoice raised', description: candidate.title })
      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not raise this invoice'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Invoice failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Raise invoice"
      description={candidate ? candidate.title : 'Choose a fee head to bill.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting || !candidate}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Raising" /> : null}
            Raise invoice
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        {candidate ? (
          <dl className="border-line bg-canvas rounded-lg border p-4 text-[13px]">
            <div className="flex items-center justify-between py-1">
              <dt className="text-ink-muted">Gross</dt>
              <dd className="text-ink tabular-nums">{formatPaise(candidate.grossPaise)}</dd>
            </div>
            <div className="flex items-center justify-between py-1">
              <dt className="text-ink-muted">Concession</dt>
              <dd className="text-ink tabular-nums">
                {candidate.concessionPaise > 0 ? `−${formatPaise(candidate.concessionPaise)}` : '—'}
              </dd>
            </div>
            <div className="border-line mt-1 flex items-center justify-between border-t py-1 pt-2">
              <dt className="text-ink font-medium">Net amount</dt>
              <dd className="text-primary font-medium tabular-nums">{formatPaise(candidate.netPaise)}</dd>
            </div>
          </dl>
        ) : null}

        <Input
          label="Due date"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate', { required: 'A due date is required' })}
        />

        <Textarea
          label="Notes (optional)"
          rows={2}
          placeholder="Anything the family should know…"
          {...register('notes')}
        />
      </form>
    </Sheet>
  )
}
