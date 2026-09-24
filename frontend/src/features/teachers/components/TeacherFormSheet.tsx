import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'
import { emailRules } from '@/lib/validation'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useSubjectOptions } from '@/features/subjects/api'
import { useCreateTeacher, useUpdateTeacher } from '@/features/teachers/api'
import type { TeacherInput, TeacherListItem } from '@/types/people'

interface TeacherFormSheetProps {
  open: boolean
  onClose: () => void
  /** Null adds a teacher; a card edits that one. */
  teacher: TeacherListItem | null
}

interface FormValues {
  fullName: string
  subject: string
  email: string
  phone: string
  qualification: string
  experienceYears: string
  classIds: string[]
}

/**
 * Add and edit share one form: the sheet is keyed on the target teacher, so it mounts with that
 * teacher's values and never carries a previous edit across.
 */
export function TeacherFormSheet({ open, onClose, teacher }: TeacherFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const classOptions = useClassOptions()
  const subjectOptions = useSubjectOptions()
  const createTeacher = useCreateTeacher()
  const updateTeacher = useUpdateTeacher()
  const editing = teacher !== null

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: teacher ? `${teacher.firstName} ${teacher.lastName}` : '',
      subject: teacher?.subject ?? '',
      email: teacher?.email ?? '',
      phone: teacher?.phone ?? '',
      qualification: teacher?.qualification ?? '',
      experienceYears: teacher?.experienceYears ? String(teacher.experienceYears) : '',
      classIds: teacher?.classIds ?? [],
    },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: TeacherInput = {
      fullName: values.fullName.trim(),
      subject: values.subject,
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      qualification: values.qualification.trim() || null,
      experienceYears: values.experienceYears.trim() ? Number(values.experienceYears) : null,
      classIds: values.classIds,
    }

    try {
      if (teacher) {
        await updateTeacher.mutateAsync({ id: teacher.id, input })
        toast({ tone: 'success', title: `${input.fullName} updated` })
      } else {
        const created = await createTeacher.mutateAsync(input)
        const invite = created.invite
        const demoPassword =
          env.enableMocks && invite?.mockOnlyPassword ? ` · demo password ${invite.mockOnlyPassword}` : ''

        toast({
          tone: 'success',
          title: `${input.fullName} added`,
          description: invite
            ? `Verification email sent to ${invite.email}${demoPassword} — the login unlocks once it is confirmed.`
            : undefined,
        })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this teacher'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit teacher' : 'Add new teacher'}
      description={
        editing
          ? `Update the record for ${teacher?.firstName} ${teacher?.lastName}.`
          : 'Create the staff record and their login — the employee number is generated for you.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Add teacher'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            placeholder="Full name"
            error={errors.fullName?.message}
            {...register('fullName', { required: 'Full name is required' })}
          />

          <Controller
            control={control}
            name="subject"
            rules={{ required: 'Choose a subject' }}
            render={({ field }) => (
              <Select
                label="Subject"
                options={subjectOptions}
                placeholder="Select subject…"
                value={field.value}
                onValueChange={field.onChange}
                error={errors.subject?.message}
              />
            )}
          />
        </div>

        <Input
          label="Sign-in email"
          type="email"
          placeholder="teacher@example.com"
          hint="Their login — the invite and its password go here."
          error={errors.email?.message}
          {...register('email', emailRules)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone" type="tel" placeholder="Phone" {...register('phone')} />
          <Input
            label="Experience"
            type="number"
            min={0}
            placeholder="e.g. 5"
            hint="Whole years."
            {...register('experienceYears')}
          />
        </div>

        <Input label="Qualification" placeholder="e.g. BSc, MSc" {...register('qualification')} />

        <div className="border-line space-y-3 border-t pt-5">
          <Controller
            control={control}
            name="classIds"
            render={({ field }) => (
              <div>
                <p className="text-ink text-[14px] font-medium">Assign classes</p>
                <p className="text-ink-muted mt-0.5 text-[12px]">Tap a class to add or remove it.</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(classOptions.data ?? []).map((option) => {
                    const selected = field.value.includes(option.id)

                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          field.onChange(
                            selected ? field.value.filter((id) => id !== option.id) : [...field.value, option.id],
                          )
                        }
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
                          selected
                            ? 'border-primary bg-primary-soft text-primary'
                            : 'border-line text-ink-muted hover:bg-primary-soft hover:text-primary',
                        )}>
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          />
        </div>
      </form>
    </Sheet>
  )
}
