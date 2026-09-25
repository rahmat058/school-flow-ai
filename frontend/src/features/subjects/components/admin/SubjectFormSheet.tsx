import { useId } from 'react'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { School } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
}

/**
 * Add and edit share one form. The parent keys the sheet on the target subject, so it mounts with
 * that subject's values and never carries a previous edit across.
 *
 * This form **never assigns classes**: which classes teach a subject is the Assign Subjects tab's
 * job, where adding and removing are both explicit. An edit therefore shows the classes it is taught
 * in as a read-only list and points there, rather than offering a second, partial way to change them.
 */
export function SubjectFormSheet({ open, onClose, subject }: SubjectFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const classOptions = useClassOptions()
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const editing = subject !== null

  const linkedClasses = (subject?.classIds ?? []).flatMap((classId) => {
    const option = classOptions.data?.find((item) => item.id === classId)
    return option ? [option] : []
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: subject?.name ?? '',
      code: subject?.code ?? '',
      description: subject?.description ?? '',
    },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: SubjectInput = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      description: values.description.trim() || null,
    }

    try {
      if (subject) {
        await updateSubject.mutateAsync({ id: subject.id, input })
        toast({ tone: 'success', title: `${input.name} updated` })
      } else {
        await createSubject.mutateAsync(input)
        toast({
          tone: 'success',
          title: `${input.name} added to the catalogue`,
          description: 'Assign it to classes from the Assign Subjects tab.',
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
          ? 'Rename the subject, change its code or rewrite the description.'
          : 'Add a subject to the school catalogue, then assign it to classes.'
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

        {editing ? (
          <div className="border-line bg-canvas rounded-lg border p-3.5">
            <p className="text-ink text-[13px] font-medium">Assigned classes</p>

            {linkedClasses.length === 0 ? (
              <p className="text-ink-muted mt-1.5 text-[13px]">Not taught in any class yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {linkedClasses.map((classRoom) => (
                  <span
                    key={classRoom.id}
                    className="border-line bg-surface text-ink-muted inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px] font-medium">
                    <School className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                    {classRoom.label}
                  </span>
                ))}
              </div>
            )}

            <p className="text-ink-subtle mt-2 text-[12px]">
              Managed in the Assign Subjects tab — add or remove them there.
            </p>
          </div>
        ) : null}
      </form>
    </Sheet>
  )
}
