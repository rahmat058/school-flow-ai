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
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useCreateHomework, useUpdateHomework } from '@/features/homework/api'
import { useSubjects } from '@/features/subjects/api'
import type { HomeworkInput, HomeworkListItem } from '@/types/homework'

interface HomeworkFormSheetProps {
  open: boolean
  onClose: () => void
  /** Null assigns a new task; a card edits that assignment. */
  homework: HomeworkListItem | null
}

interface FormValues {
  classId: string
  subjectId: string
  title: string
  description: string
  dueDate: string
  maxMarks: string
}

/**
 * Add and edit share one form. The parent keys the sheet on the target assignment, so it mounts with
 * that assignment's values and never carries a previous edit across.
 */
export function HomeworkFormSheet({ open, onClose, homework }: HomeworkFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const classOptions = useClassOptions()
  const createHomework = useCreateHomework()
  const updateHomework = useUpdateHomework()
  const editing = homework !== null

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      classId: homework?.classId ?? '',
      subjectId: homework?.subjectId ?? '',
      title: homework?.title ?? '',
      description: homework?.description ?? '',
      dueDate: homework?.dueDate ?? '',
      maxMarks: homework?.maxMarks != null ? String(homework.maxMarks) : '',
    },
    mode: 'onTouched',
  })

  // Subjects belong to a class, so the list cannot be offered until one is chosen.
  const classId = useWatch({ control, name: 'classId' })
  const subjects = useSubjects(classId ? { classId } : {})
  const subjectOptions = classId
    ? (subjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name }))
    : []

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: HomeworkInput = {
      classId: values.classId,
      subjectId: values.subjectId,
      title: values.title.trim(),
      description: values.description.trim() || null,
      dueDate: values.dueDate,
      maxMarks: values.maxMarks.trim() ? Number(values.maxMarks) : null,
    }

    try {
      if (homework) {
        await updateHomework.mutateAsync({ id: homework.id, input })
        toast({ tone: 'success', title: `${input.title} updated` })
      } else {
        await createHomework.mutateAsync(input)
        toast({
          tone: 'success',
          title: `${input.title} assigned`,
          description: 'Students in the class can see it now.',
        })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this assignment'
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
      title={editing ? 'Edit homework assignment' : 'New homework assignment'}
      description={
        editing
          ? 'Update the task, its deadline or its marks ceiling.'
          : 'Pick a class and subject, then describe what the students have to do.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Assign homework'}
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
              onValueChange={(value) => {
                field.onChange(value)
                // The chosen subject may not be taught in the new class.
                setValue('subjectId', '')
              }}
              error={errors.classId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="subjectId"
          rules={{ required: 'Choose a subject' }}
          render={({ field }) => (
            <Select
              label="Subject"
              options={subjectOptions}
              placeholder={classId ? 'Select subject…' : 'Select a class first…'}
              value={field.value}
              onValueChange={field.onChange}
              disabled={!classId || subjects.isPending}
              error={errors.subjectId?.message}
            />
          )}
        />

        <Input
          label="Title"
          placeholder="e.g. Chapter 5 — Exercise 2"
          error={errors.title?.message}
          {...register('title', { required: 'A title is required' })}
        />

        <Textarea
          label="Instructions"
          rows={4}
          placeholder="Describe the homework task in detail…"
          error={errors.description?.message}
          {...register('description', { required: 'Instructions are required' })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Due date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate', { required: 'A due date is required' })}
          />

          <Input
            label="Max marks"
            type="number"
            min={1}
            placeholder="Optional"
            hint="Leave blank if it is not marked."
            error={errors.maxMarks?.message}
            {...register('maxMarks', {
              validate: (value) => !value.trim() || Number(value) > 0 || 'Max marks must be greater than zero',
            })}
          />
        </div>
      </form>
    </Sheet>
  )
}
