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
import { useCreateTest, useUpdateTest } from '@/features/exams/api'
import { useSubjects } from '@/features/subjects/api'
import type { TestInput, TestListItem } from '@/types/exams'

interface TestFormSheetProps {
  open: boolean
  onClose: () => void
  /** Null creates a test; a row edits that one. */
  test: TestListItem | null
}

interface FormValues {
  classId: string
  subjectId: string
  name: string
  examDate: string
  maxMarks: string
  durationMin: string
  description: string
}

export function TestFormSheet({ open, onClose, test }: TestFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const classOptions = useClassOptions()
  const createTest = useCreateTest()
  const updateTest = useUpdateTest()
  const editing = test !== null

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      classId: test?.classId ?? '',
      subjectId: test?.subjectId ?? '',
      name: test?.name ?? '',
      examDate: test?.examDate ?? '',
      maxMarks: test ? String(test.maxMarks) : '',
      durationMin: test ? String(test.durationMin) : '',
      description: '',
    },
    mode: 'onTouched',
  })

  // Subjects belong to a class, so the list cannot be offered until one is chosen.
  const classId = useWatch({ control, name: 'classId' })
  const subjects = useSubjects(classId ? { classId } : {})
  const subjectOptions = classId
    ? (subjects.data ?? []).map((subject) => ({
        value: subject.id,
        label: `${subject.name} (${subject.code.split('-')[0]})`,
      }))
    : []

  const classSelectOptions = [
    { value: '', label: 'Select class…' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: TestInput = {
      classId: values.classId,
      subjectId: values.subjectId,
      name: values.name.trim(),
      examDate: values.examDate,
      maxMarks: Number(values.maxMarks),
      durationMin: Number(values.durationMin),
      description: values.description.trim() || null,
    }

    try {
      if (test) {
        await updateTest.mutateAsync({ id: test.id, input })
        toast({ tone: 'success', title: `${input.name} updated` })
      } else {
        await createTest.mutateAsync(input)
        toast({ tone: 'success', title: `${input.name} created`, description: 'It is on the tests list now.' })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this test'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit test' : 'Create test'}
      description="Single-subject unit test for one class."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Create test'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
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
                disabled={editing}
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
                placeholder={classId ? 'Select subject…' : 'Select class first'}
                value={field.value}
                onValueChange={field.onChange}
                disabled={!classId || subjects.isPending}
                error={errors.subjectId?.message}
              />
            )}
          />
        </div>

        <Input
          label="Title"
          placeholder="e.g. Unit Test 1 — Algebra"
          error={errors.name?.message}
          {...register('name', { required: 'A title is required' })}
        />

        <Input
          label="Date"
          type="date"
          error={errors.examDate?.message}
          {...register('examDate', { required: 'A date is required' })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Total marks"
            type="number"
            min={1}
            placeholder="100"
            error={errors.maxMarks?.message}
            {...register('maxMarks', {
              required: 'Total marks are required',
              validate: (value) => Number(value) > 0 || 'Total marks must be greater than zero',
            })}
          />
          <Input
            label="Duration (min)"
            type="number"
            min={1}
            placeholder="60"
            error={errors.durationMin?.message}
            {...register('durationMin', {
              required: 'A duration is required',
              validate: (value) => Number(value) > 0 || 'Duration must be greater than zero',
            })}
          />
        </div>

        <Textarea label="Description (optional)" rows={3} placeholder="Optional notes…" {...register('description')} />
      </form>
    </Sheet>
  )
}
