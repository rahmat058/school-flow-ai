import { useId } from 'react'
import { BookOpen, Check } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/cn'
import { examTypeOptions } from '@/lib/options'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useCreateExam, useUpdateExam } from '@/features/exams/api'
import { useSubjects } from '@/features/subjects/api'
import type { ExamInput, ExamListItem, ExamType } from '@/types/exams'

interface ExamFormSheetProps {
  open: boolean
  onClose: () => void
  /** Null schedules a new exam; a row edits that one. */
  exam: ExamListItem | null
}

interface SubjectField {
  subjectId: string
  examDate: string
  maxMarks: string
  durationMin: string
}

interface FormValues {
  classId: string
  name: string
  type: string
  startDate: string
  endDate: string
  description: string
  subjects: SubjectField[]
}

export function ExamFormSheet({ open, onClose, exam }: ExamFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const classOptions = useClassOptions()
  const createExam = useCreateExam()
  const updateExam = useUpdateExam()
  const editing = exam !== null

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      classId: exam?.classId ?? '',
      name: exam?.name ?? '',
      type: exam?.type ?? 'MID',
      startDate: exam?.startDate ?? '',
      endDate: exam?.endDate ?? '',
      description: '',
      subjects:
        exam?.subjects.map((subject) => ({
          subjectId: subject.subjectId,
          examDate: subject.examDate,
          maxMarks: String(subject.maxMarks),
          durationMin: String(subject.durationMin),
        })) ?? [],
    },
    mode: 'onTouched',
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'subjects' })
  const classId = useWatch({ control, name: 'classId' })
  const startDate = useWatch({ control, name: 'startDate' })
  const chosen = useWatch({ control, name: 'subjects' }) ?? []

  const subjects = useSubjects(classId ? { classId } : {})
  const subjectList = subjects.data ?? []

  function toggleSubject(subjectId: string) {
    const index = chosen.findIndex((subject) => subject.subjectId === subjectId)
    if (index >= 0) {
      remove(index)
      return
    }

    append({ subjectId, examDate: startDate || '', maxMarks: '100', durationMin: '180' })
  }

  const classSelectOptions = [
    { value: '', label: 'Select class…' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: ExamInput = {
      classId: values.classId,
      name: values.name.trim(),
      type: values.type as ExamType,
      startDate: values.startDate,
      endDate: values.endDate,
      description: values.description.trim() || null,
      subjects: values.subjects.map((subject) => ({
        subjectId: subject.subjectId,
        examDate: subject.examDate,
        maxMarks: Number(subject.maxMarks),
        durationMin: Number(subject.durationMin),
      })),
    }

    try {
      if (exam) {
        await updateExam.mutateAsync({ id: exam.id, input })
        toast({ tone: 'success', title: `${input.name} updated` })
      } else {
        await createExam.mutateAsync(input)
        toast({ tone: 'success', title: `${input.name} scheduled`, description: 'It is on the exams list now.' })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this exam'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit exam' : 'Create exam'}
      description="Multi-subject scheduled exam for one class."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Create exam'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <Input
          label="Exam title"
          placeholder="e.g. Mid-Term Examination 2026"
          error={errors.name?.message}
          {...register('name', { required: 'A title is required' })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="type"
            rules={{ required: 'Choose an exam type' }}
            render={({ field }) => (
              <Select
                label="Exam type"
                options={examTypeOptions}
                placeholder="Select type…"
                value={field.value}
                onValueChange={field.onChange}
                error={errors.type?.message}
              />
            )}
          />

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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate', { required: 'A start date is required' })}
          />
          <Input
            label="End date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate', { required: 'An end date is required' })}
          />
        </div>

        <Textarea
          label="Description (optional)"
          rows={2}
          placeholder="Optional instructions or notes…"
          {...register('description')}
        />

        <div>
          <p className="text-ink mb-2 text-[13px] font-medium">Select subjects</p>

          {!classId ? (
            <p className="text-ink-subtle text-[13px]">Choose a class first — its subjects load here.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {subjectList.map((subject) => {
                const isChosen = chosen.some((item) => item.subjectId === subject.id)

                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    aria-pressed={isChosen}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                      isChosen
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-line text-ink-muted hover:border-primary hover:text-primary',
                    )}>
                    <span
                      className={cn(
                        'inline-flex size-4 shrink-0 items-center justify-center rounded-full border',
                        isChosen ? 'border-primary bg-primary text-white' : 'border-line',
                      )}>
                      {isChosen ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 truncate">{subject.name}</span>
                    <span className="text-ink-subtle ml-auto shrink-0 text-[10.5px] uppercase">
                      {subject.code.split('-')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {errors.subjects?.message ? <p className="text-error mt-1.5 text-[12px]">{errors.subjects.message}</p> : null}
        </div>

        {fields.length > 0 ? (
          <div className="space-y-2">
            <p className="text-ink text-[13px] font-medium">Set date, marks &amp; duration per subject:</p>

            {fields.map((field, index) => {
              const subject = subjectList.find((item) => item.id === field.subjectId)
              const label = subject?.name ?? 'Subject'

              return (
                <div
                  key={field.id}
                  className="border-line grid items-center gap-2 rounded-lg border p-2.5 sm:grid-cols-[1.3fr_1.2fr_0.8fr_0.8fr]">
                  <span className="text-ink flex min-w-0 items-center gap-2 text-[13px] font-medium">
                    <BookOpen className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{label}</span>
                  </span>

                  <Input
                    type="date"
                    aria-label={`${label} date`}
                    error={errors.subjects?.[index]?.examDate?.message}
                    {...register(`subjects.${index}.examDate` as const, { required: 'A date is required' })}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Marks"
                    aria-label={`${label} marks`}
                    error={errors.subjects?.[index]?.maxMarks?.message}
                    {...register(`subjects.${index}.maxMarks` as const, { required: 'Marks are required' })}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Min"
                    aria-label={`${label} duration`}
                    error={errors.subjects?.[index]?.durationMin?.message}
                    {...register(`subjects.${index}.durationMin` as const, { required: 'Duration is required' })}
                  />
                </div>
              )
            })}
          </div>
        ) : null}
      </form>
    </Sheet>
  )
}
