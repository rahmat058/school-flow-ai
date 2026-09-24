import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useCreateFeeHead, useUpdateFeeHead } from '@/features/fees/api'
import type { FeeFrequency, FeeHeadInput, FeeHeadRow } from '@/types/fees'

const FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'ONE_TIME', label: 'One-time' },
]

interface FeeHeadSheetProps {
  open: boolean
  onClose: () => void
  /** The class the head is added to; ignored when editing, since a head cannot change class. */
  classId: string
  academicYear: string
  /** Null adds a head; a row edits that one. */
  head: FeeHeadRow | null
}

interface FormValues {
  classId: string
  title: string
  amount: string
  frequency: string
  dueDate: string
  academicYear: string
  description: string
}

/**
 * Add and edit share one form. The parent keys the sheet on the target head, so it mounts with that
 * head's values and never carries a previous edit across.
 */
export function FeeHeadSheet({ open, onClose, classId, academicYear, head }: FeeHeadSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const classOptions = useClassOptions()
  const createFeeHead = useCreateFeeHead()
  const updateFeeHead = useUpdateFeeHead()
  const editing = head !== null

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      classId,
      title: head?.name ?? '',
      amount: head ? String(head.amountPaise / 100) : '',
      frequency: head?.frequency ?? 'ONE_TIME',
      dueDate: head?.dueDate ?? '',
      academicYear: head?.academicYear ?? academicYear,
      description: head?.description ?? '',
    },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: FeeHeadInput = {
      classId: values.classId,
      title: values.title.trim(),
      amountPaise: Math.round(Number(values.amount) * 100),
      frequency: values.frequency as FeeFrequency,
      dueDate: values.dueDate,
      academicYear: values.academicYear.trim(),
      description: values.description.trim() || null,
    }

    try {
      if (head) {
        await updateFeeHead.mutateAsync({ id: head.id, input })
        toast({ tone: 'success', title: `${input.title} updated` })
      } else {
        await createFeeHead.mutateAsync(input)
        toast({ tone: 'success', title: `${input.title} added`, description: 'Invoices can be raised from it now.' })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this fee head'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  const classSelectOptions = [
    { value: '', label: 'Choose a class' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit fee head' : 'Add fee head'}
      description={
        editing
          ? 'Update what this class is charged for this head.'
          : 'Define a line item for the class — invoices are raised from it.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Add fee head'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <Controller
          control={control}
          name="classId"
          rules={{ required: 'Choose a class' }}
          render={({ field }) => (
            <Select
              label="Class"
              options={classSelectOptions}
              value={field.value}
              onValueChange={field.onChange}
              disabled={editing}
              error={errors.classId?.message}
            />
          )}
        />

        <Input
          label="Title"
          placeholder="e.g. Tuition Fee"
          error={errors.title?.message}
          {...register('title', { required: 'A title is required' })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount ($)"
            type="number"
            min={1}
            step="0.01"
            placeholder="0"
            error={errors.amount?.message}
            {...register('amount', {
              required: 'Amount is required',
              validate: (value) => Number(value) > 0 || 'Amount must be greater than zero',
            })}
          />

          <Controller
            control={control}
            name="frequency"
            rules={{ required: 'Choose a frequency' }}
            render={({ field }) => (
              <Select
                label="Frequency"
                options={FREQUENCY_OPTIONS}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.frequency?.message}
              />
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Due date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate', { required: 'A due date is required' })}
          />
          <Input
            label="Academic year"
            placeholder="e.g. 2026-27"
            error={errors.academicYear?.message}
            {...register('academicYear', { required: 'Academic year is required' })}
          />
        </div>

        <Textarea label="Description (optional)" rows={2} placeholder="Notes…" {...register('description')} />
      </form>
    </Sheet>
  )
}
