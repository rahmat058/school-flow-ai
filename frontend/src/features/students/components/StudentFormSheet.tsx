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
import { env } from '@/lib/env'
import { bloodGroupOptions, genderOptions } from '@/lib/options'
import { emailRules } from '@/lib/validation'
import { ApiError } from '@/services/apiClient'
import { useClassOptions, useCreateStudent, useUpdateStudent } from '@/features/students/api'
import type { BloodGroup, Gender, Guardian, StudentInput, StudentListItem } from '@/types/people'

interface StudentFormSheetProps {
  open: boolean
  onClose: () => void
  /** Null enrols a new student; a row edits that one. */
  student: StudentListItem | null
}

interface FormValues {
  firstName: string
  lastName: string
  classId: string
  rollNo: string
  dateOfBirth: string
  gender: string
  bloodGroup: string
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  guardianAddress: string
}

/**
 * Create and edit share one form: the sheet is keyed on the target student, so it mounts with that
 * student's values and never carries a previous edit across.
 */
export function StudentFormSheet({ open, onClose, student }: StudentFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const classOptions = useClassOptions()
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const editing = student !== null

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      firstName: student?.firstName ?? '',
      lastName: student?.lastName ?? '',
      classId: student?.classId ?? '',
      rollNo: student ? String(student.rollNo) : '',
      dateOfBirth: student?.dateOfBirth ?? '',
      gender: student?.gender ?? '',
      bloodGroup: student?.bloodGroup ?? '',
      guardianName: student?.guardian?.name ?? '',
      guardianEmail: student?.guardian?.email ?? '',
      guardianPhone: student?.guardian?.phone ?? '',
      guardianAddress: student?.guardian?.address ?? '',
    },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const guardianName = values.guardianName.trim()
    const guardian: Guardian | null = guardianName
      ? {
          name: guardianName,
          email: values.guardianEmail.trim() || null,
          phone: values.guardianPhone.trim() || null,
          address: values.guardianAddress.trim() || null,
        }
      : null

    const input: StudentInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      classId: values.classId,
      rollNo: values.rollNo.trim() ? Number(values.rollNo) : null,
      dateOfBirth: values.dateOfBirth || null,
      gender: values.gender ? (values.gender as Gender) : null,
      bloodGroup: values.bloodGroup ? (values.bloodGroup as BloodGroup) : null,
      guardian,
    }

    try {
      if (student) {
        await updateStudent.mutateAsync({ id: student.id, input })
        toast({ tone: 'success', title: `${input.firstName} ${input.lastName} updated` })
      } else {
        const created = await createStudent.mutateAsync(input)
        const invite = created.invite
        // The login is created with the enrolment; the password goes out by email, so in mock mode
        // (where there is no inbox) it is shown here instead.
        const demoPassword =
          env.enableMocks && invite?.mockOnlyPassword ? ` · demo password ${invite.mockOnlyPassword}` : ''

        toast({
          tone: 'success',
          title: `${input.firstName} ${input.lastName} enrolled`,
          description: invite
            ? `Verification email sent to ${invite.email}${demoPassword} — the login unlocks once it is confirmed.`
            : 'They can sign in once an admin shares their credentials.',
        })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this student'
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
      title={editing ? 'Edit student' : 'Add student'}
      description={
        editing
          ? `Update the record for ${student?.firstName} ${student?.lastName}.`
          : 'Enrol a student and their guardian — the admission number and login are generated for you.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Add student'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            placeholder="Ayesha"
            error={errors.firstName?.message}
            {...register('firstName', { required: 'First name is required' })}
          />
          <Input
            label="Last name"
            placeholder="Khan"
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Last name is required' })}
          />
        </div>

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
                onValueChange={field.onChange}
                error={errors.classId?.message}
              />
            )}
          />
          <Input
            label="Roll no."
            type="number"
            min={1}
            placeholder="1"
            hint="Unique within the class."
            error={errors.rollNo?.message}
            {...register('rollNo', {
              required: 'Roll number is required',
              validate: (value) => Number(value) > 0 || 'Roll number must be at least 1',
            })}
          />
        </div>

        <div className="grid gap-4">
          <Input
            label="Date of birth"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth', { required: 'Date of birth is required' })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="gender"
            rules={{ required: 'Choose a gender' }}
            render={({ field }) => (
              <Select
                label="Gender"
                options={genderOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.gender?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="bloodGroup"
            rules={{ required: 'Choose a blood group' }}
            render={({ field }) => (
              <Select
                label="Blood group"
                options={bloodGroupOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.bloodGroup?.message}
              />
            )}
          />
        </div>

        <div className="border-line space-y-4 border-t pt-5">
          <div>
            <h3 className="text-ink text-[14px] font-medium">Guardian</h3>
            <p className="text-ink-muted mt-0.5 text-[12px]">The primary contact for this student.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Parent name"
              placeholder="Rahim Khan"
              error={errors.guardianName?.message}
              {...register('guardianName', { required: 'Parent name is required' })}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+8801XXXXXXXXX"
              error={errors.guardianPhone?.message}
              {...register('guardianPhone', {
                required: 'Phone is required',
                minLength: { value: 6, message: 'Enter a full phone number' },
              })}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="parent@example.com"
            error={errors.guardianEmail?.message}
            {...register('guardianEmail', emailRules)}
          />
          <Textarea
            label="Address"
            rows={2}
            placeholder="House, road, area"
            error={errors.guardianAddress?.message}
            {...register('guardianAddress', { required: 'Address is required' })}
          />
        </div>
      </form>
    </Sheet>
  )
}
