import { useId } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/cn'
import { concessionCategoryOptions, concessionTypeOptions } from '@/lib/options'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useConcessionFormOptions } from '@/features/fees/hooks/useConcessionFormOptions'
import { useCreateConcession, useUpdateConcession } from '@/features/fees/api'
import type { ConcessionCategory, ConcessionInput, ConcessionRow, ConcessionType } from '@/types/fees'

interface ConcessionSheetProps {
  open: boolean
  onClose: () => void
  /** Null adds a concession; a row edits that one. */
  concession: ConcessionRow | null
}

interface FormValues {
  studentId: string
  feeHeadId: string
  category: string
  type: string
  value: string
  description: string
}

/** Add and edit share one form, keyed by the parent on the target concession. */
export function ConcessionSheet({ open, onClose, concession }: ConcessionSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const createConcession = useCreateConcession()
  const updateConcession = useUpdateConcession()
  const editing = concession !== null

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      studentId: concession?.studentId ?? '',
      feeHeadId: concession?.feeHeadId ?? '',
      category: concession?.category ?? 'CUSTOM',
      type: concession?.type ?? 'PERCENTAGE',
      value: concession
        ? concession.type === 'PERCENTAGE'
          ? String(concession.percentage ?? '')
          : String((concession.amountPaise ?? 0) / 100)
        : '',
      description: concession?.reason ?? '',
    },
    mode: 'onTouched',
  })

  const studentId = useWatch({ control, name: 'studentId' })
  const discountType = useWatch({ control, name: 'type' })
  const { studentOptions, headOptions } = useConcessionFormOptions(studentId)

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const isPercentage = values.type === 'PERCENTAGE'
    const input: ConcessionInput = {
      studentId: values.studentId,
      feeHeadId: values.feeHeadId || null,
      category: values.category as ConcessionCategory,
      type: values.type as ConcessionType,
      percentage: isPercentage ? Number(values.value) : null,
      amountPaise: isPercentage ? null : Math.round(Number(values.value) * 100),
      reason: values.description.trim() || null,
    }

    try {
      if (concession) {
        await updateConcession.mutateAsync({ id: concession.id, input })
        toast({ tone: 'success', title: 'Concession updated' })
      } else {
        await createConcession.mutateAsync(input)
        toast({ tone: 'success', title: 'Concession recorded', description: 'It applies to the next invoice.' })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this concession'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit concession' : 'Add concession'}
      description="Apply a percentage or flat discount for one student, optionally against one fee head."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Add concession'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <Controller
          control={control}
          name="studentId"
          rules={{ required: 'Choose a student' }}
          render={({ field }) => (
            <Select
              label="Student"
              options={studentOptions}
              placeholder="Choose a student"
              value={field.value}
              onValueChange={field.onChange}
              error={errors.studentId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="feeHeadId"
          render={({ field }) => (
            <Select
              label="Fee structure (optional — leave blank for all)"
              options={headOptions}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="category"
            rules={{ required: 'Choose a concession type' }}
            render={({ field }) => (
              <Select
                label="Concession type"
                options={concessionCategoryOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.category?.message}
              />
            )}
          />

          <div>
            <p className="text-ink mb-1.5 text-[13px] font-medium">Discount type</p>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <div className="bg-canvas inline-flex rounded-lg p-1">
                  {concessionTypeOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => field.onChange(item.value)}
                      aria-pressed={field.value === item.value}
                      className={cn(
                        'h-8 rounded-md px-3 text-[13px] font-medium transition-colors',
                        field.value === item.value
                          ? 'bg-primary-soft text-primary'
                          : 'text-ink-muted hover:text-primary',
                      )}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        <Input
          label={discountType === 'PERCENTAGE' ? 'Value (%)' : 'Value ($)'}
          type="number"
          min={1}
          step={discountType === 'PERCENTAGE' ? 1 : 0.01}
          placeholder="e.g. 20 or 500"
          error={errors.value?.message}
          {...register('value', {
            required: 'A value is required',
            validate: (value) => {
              const parsed = Number(value)
              if (parsed <= 0) return 'Enter a value greater than zero'
              if (discountType === 'PERCENTAGE' && parsed > 100) return 'A percentage cannot exceed 100'
              return true
            },
          })}
        />

        <Textarea
          label="Description (optional)"
          rows={2}
          placeholder="Reason for concession…"
          {...register('description')}
        />
      </form>
    </Sheet>
  )
}
