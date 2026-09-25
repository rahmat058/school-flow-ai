import { useId } from 'react'
import { Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { weekdayLabels } from '@/data/timetable'
import { useSetSlot } from '@/features/timetable/api'
import { useSubjects } from '@/features/subjects/api'
import { useTeachers } from '@/features/teachers/api'
import type { TimetableSlot, Weekday } from '@/types/timetable'

/** The cell the sheet is editing — retained on close so the panel can animate out. */
export interface EditEntryTarget {
  day: Weekday
  orderIndex: number
  /** The period row's label, e.g. `Period 4`. */
  label: string
  slot: TimetableSlot
}

interface EditEntrySheetProps {
  open: boolean
  onClose: () => void
  classId: string
  target: EditEntryTarget | null
}

interface FormValues {
  subjectId: string
  teacherId: string
}

/**
 * Edit one cell of the grid. The parent keys the sheet on the cell, so it mounts with that cell's
 * values and never carries a previous edit across.
 */
export function EditEntrySheet({ open, onClose, classId, target }: EditEntrySheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const subjects = useSubjects({ classId })
  const teachers = useTeachers()
  const setSlot = useSetSlot(classId)

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { subjectId: target?.slot.subjectId ?? '', teacherId: target?.slot.teacherId ?? '' },
    mode: 'onTouched',
  })

  const subjectOptions = (subjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name }))
  const teacherOptions = [
    { value: '', label: 'No teacher' },
    ...(teachers.data ?? []).map((teacher) => ({
      value: teacher.id,
      label: `${teacher.firstName} ${teacher.lastName}`,
    })),
  ]

  const where = target ? `${weekdayLabels[target.day]} · ${target.label}` : 'this period'

  async function save(values: FormValues) {
    if (!target) return

    try {
      await setSlot.mutateAsync({
        day: target.day,
        orderIndex: target.orderIndex,
        subjectId: values.subjectId || null,
        teacherId: values.teacherId || null,
      })
      toast({ tone: 'success', title: `${where} updated` })
      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this entry'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  const onSubmit: SubmitHandler<FormValues> = (values) => save(values)

  async function clearEntry() {
    if (!target) return

    try {
      await setSlot.mutateAsync({ day: target.day, orderIndex: target.orderIndex, subjectId: null, teacherId: null })
      toast({ tone: 'success', title: `${where} cleared` })
      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not clear this entry'
      toast({ tone: 'error', title: 'Clear failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={target ? `Edit entry — ${weekdayLabels[target.day]} · ${target.label}` : 'Edit entry'}
      description="Pick the subject this period teaches, and who takes it."
      footer={
        <>
          <Button variant="secondary" className="mr-auto" onClick={clearEntry} disabled={isSubmitting}>
            <Trash2 className="size-4" strokeWidth={1.75} />
            Clear
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            Save
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <Controller
          control={control}
          name="subjectId"
          rules={{ required: 'Choose a subject' }}
          render={({ field }) => (
            <Select
              label="Subject"
              options={subjectOptions}
              placeholder="Select subject…"
              value={field.value}
              onValueChange={field.onChange}
              disabled={subjects.isPending}
              error={errors.subjectId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="teacherId"
          render={({ field }) => (
            <Select
              label="Teacher (optional)"
              options={teacherOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.teacherId?.message}
            />
          )}
        />
      </form>
    </Sheet>
  )
}
