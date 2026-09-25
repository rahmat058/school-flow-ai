import { useId } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useAddPeriodRow } from '@/features/timetable/api'
import type { TimetablePeriodInput, TimetablePeriodRow } from '@/types/timetable'

interface ManagePeriodsSheetProps {
  open: boolean
  onClose: () => void
  classId: string
  classLabel: string
  /** The class's period rows, in order — the same structure every day runs. */
  periods: TimetablePeriodRow[]
  onRequestRemove: (row: TimetablePeriodRow) => void
}

interface FormValues {
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
}

/**
 * The period rows are the class's, not one day's: adding or removing a row changes every day of the
 * week at once, which is why this is a class-level dialog rather than a per-day editor.
 */
export function ManagePeriodsSheet({
  open,
  onClose,
  classId,
  classLabel,
  periods,
  onRequestRemove,
}: ManagePeriodsSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const addPeriodRow = useAddPeriodRow(classId)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { label: '', startTime: '', endTime: '', isBreak: false },
    mode: 'onTouched',
  })

  // The left-hand number counts teaching rows, so it matches the `Period n` labels around the breaks.
  const ordinal = new Map<number, number>()
  let teaching = 0
  for (const row of periods) {
    if (!row.isBreak) teaching += 1
    ordinal.set(row.orderIndex, teaching)
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: TimetablePeriodInput = {
      label: values.label.trim(),
      startTime: values.startTime,
      endTime: values.endTime,
      isBreak: values.isBreak,
    }

    try {
      await addPeriodRow.mutateAsync(input)
      toast({ tone: 'success', title: `${input.label} added`, description: 'It now runs on every day of the week.' })
      // Stay open so rows can be added one after another.
      reset({ label: '', startTime: '', endTime: '', isBreak: false })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not add this row'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Manage periods"
      description={`The daily structure for ${classLabel} — every day runs these rows.`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }>
      <div className="space-y-6">
        <ul className="space-y-2">
          {periods.map((row) => (
            <li
              key={row.orderIndex}
              className={cn(
                'border-line flex items-center gap-3 rounded-lg border px-3 py-2.5',
                row.isBreak ? 'bg-orange-soft' : 'bg-surface',
              )}>
              <span className="text-ink-subtle w-4 shrink-0 text-center text-[13px] font-medium tabular-nums">
                {row.isBreak ? '–' : ordinal.get(row.orderIndex)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13.5px] font-medium">{row.label}</p>
                <p className="text-ink-subtle text-[11.5px] tabular-nums">
                  {row.startTime} – {row.endTime}
                </p>
              </div>

              {row.isBreak ? (
                <span className="text-warning shrink-0 text-[11px] font-medium tracking-[0.04em] lowercase">break</span>
              ) : null}

              <button
                type="button"
                onClick={() => onRequestRemove(row)}
                aria-label={`Remove ${row.label}`}
                title="Remove row"
                className="text-ink-subtle hover:bg-error-soft hover:text-error inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors">
                <Trash2 className="size-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>

        <div className="border-line space-y-4 border-t pt-5">
          <div>
            <h3 className="text-ink text-[14px] font-medium">Add new row</h3>
            <p className="text-ink-muted mt-0.5 text-[12px]">It is added to every day of the week.</p>
          </div>

          {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

          <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Label"
              placeholder="e.g. Period 8, Lunch, Assembly"
              error={errors.label?.message}
              {...register('label', { required: 'A label is required' })}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Start time"
                type="time"
                icon={Clock}
                error={errors.startTime?.message}
                {...register('startTime', { required: 'A start time is required' })}
              />
              <Input
                label="End time"
                type="time"
                icon={Clock}
                error={errors.endTime?.message}
                {...register('endTime', {
                  required: 'An end time is required',
                  validate: (value, values) =>
                    !values.startTime || value > values.startTime || 'The end time must be after the start time',
                })}
              />
            </div>

            <Controller
              control={control}
              name="isBreak"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label="This is a break / lunch"
                  description="Break rows are not editable in the timetable grid."
                />
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" className="text-white" label="Adding" /> : null}
              <Plus className="size-4" strokeWidth={1.75} />
              Add period
            </Button>
          </form>
        </div>
      </div>
    </Sheet>
  )
}
