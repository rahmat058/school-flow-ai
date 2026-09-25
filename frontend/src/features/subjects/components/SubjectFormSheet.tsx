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
import { useCreateSubject, useUpdateSubject } from '@/features/subjects/api'
import type { SubjectInput, SubjectRow } from '@/types/academic'

interface SubjectFormSheetProps {
  open: boolean
  onClose: () => void
  /** Null creates a subject; a row edits that catalogue entry. */
  subject: SubjectRow | null
}

interface FormValues {
  name: string
  code: string
  description: string
  classId: string
}

/**
 * Add and edit share one form. The parent keys the sheet on the target subject, so it mounts with
 * that subject's values and never carries a previous edit across.
 *
 * The **class picker** assigns the subject on create and moves it on edit. One dropdown can only
 * speak for one class, so when a subject is already taught in several the picker locks and the update
 * sends no `classId` at all — the Assign Subjects tab is where a wider set is edited.
 */
export function SubjectFormSheet({ open, onClose, subject }: SubjectFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const classOptions = useClassOptions()
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const editing = subject !== null

  const linkedClasses = subject?.classIds ?? []
  const pickerLocked = linkedClasses.length > 1

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: subject?.name ?? '',
      code: subject?.code ?? '',
      description: subject?.description ?? '',
      classId: linkedClasses[0] ?? '',
    },
    mode: 'onTouched',
  })

  const classSelectOptions = [
    { value: '', label: 'Leave unassigned' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]
  const classLabelOf = (classId: string) =>
    classOptions.data?.find((option) => option.id === classId)?.label ?? 'that class'

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: SubjectInput = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      description: values.description.trim() || null,
      // A locked picker sends no classId, so saving the name leaves every assignment alone.
      ...(pickerLocked ? {} : { classId: values.classId || null }),
    }

    try {
      if (subject) {
        const moved = !pickerLocked && values.classId !== (linkedClasses[0] ?? '')
        await updateSubject.mutateAsync({ id: subject.id, input })
        toast({
          tone: 'success',
          title: `${input.name} updated`,
          description: moved
            ? values.classId
              ? `Now taught in ${classLabelOf(values.classId)}.`
              : 'No longer assigned to any class.'
            : undefined,
        })
      } else {
        await createSubject.mutateAsync(input)

        const className = classLabelOf(values.classId)
        toast({
          tone: 'success',
          title: `${input.name} added to the catalogue`,
          description: values.classId
            ? `Already assigned to ${className} — it shows there in the Assign Subjects tab.`
            : 'Assign it to a class from the Assign Subjects tab.',
        })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this subject'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit subject' : 'Add subject'}
      description={
        editing
          ? 'Rename the subject, change its code or move it to another class.'
          : 'Add a subject to the school catalogue and assign it to a class.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Add subject'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <Input
          label="Subject name"
          placeholder="e.g. Mathematics"
          error={errors.name?.message}
          {...register('name', { required: 'A subject name is required' })}
        />

        <Input
          label="Code"
          placeholder="e.g. MATH"
          hint="Shown on every chip and badge."
          error={errors.code?.message}
          {...register('code', {
            required: 'A code is required',
            pattern: { value: /^[A-Za-z0-9]{2,6}$/, message: 'Use 2–6 letters or digits, e.g. MATH' },
          })}
        />

        <Textarea
          label="Description"
          rows={3}
          placeholder="What the subject covers…"
          error={errors.description?.message}
          {...register('description')}
        />

        <Controller
          control={control}
          name="classId"
          render={({ field }) => (
            <Select
              label="Assign to class"
              options={classSelectOptions}
              placeholder="Leave unassigned"
              value={field.value}
              onValueChange={field.onChange}
              disabled={pickerLocked || classOptions.isPending}
              hint={
                pickerLocked
                  ? `Taught in ${linkedClasses.length} classes — add or remove them in the Assign Subjects tab.`
                  : 'Every class that should teach this subject.'
              }
              error={errors.classId?.message}
            />
          )}
        />
      </form>
    </Sheet>
  )
}
