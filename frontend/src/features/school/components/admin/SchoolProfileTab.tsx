import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Building2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useUpdateSchoolProfile } from '@/features/school/api'
import { emailRules, optionalPhoneRules } from '@/lib/validation'
import type { School } from '@/types/school'

interface SchoolProfileFormValues {
  name: string
  contactEmail: string
  contactPhone: string
  address: string
}

interface SchoolProfileTabProps {
  formId: string
  school: School
}

/** The school's own columns — written by `PATCH /schools/current`, not `settings`. */
export function SchoolProfileTab({ formId, school }: SchoolProfileTabProps) {
  const { toast } = useToast()
  const updateProfile = useUpdateSchoolProfile()
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SchoolProfileFormValues>({
    mode: 'onTouched',
    defaultValues: {
      name: school.name,
      contactEmail: school.contactEmail ?? '',
      contactPhone: school.contactPhone ?? '',
      address: school.address ?? '',
    },
  })

  const onSubmit: SubmitHandler<SchoolProfileFormValues> = async (values) => {
    try {
      await updateProfile.mutateAsync({
        name: values.name.trim(),
        contactEmail: values.contactEmail.trim() || null,
        contactPhone: values.contactPhone.trim() || null,
        address: values.address.trim() || null,
      })
      toast({ tone: 'success', title: 'School profile saved' })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save the school profile'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

      <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
        <div className="flex items-start gap-3">
          <span className="bg-canvas text-ink-subtle inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Building2 className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">School Information</h2>
            <p className="text-ink-muted mt-0.5 text-[13px]">The name and contact details shown across the app.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="School Name"
            error={errors.name?.message}
            {...register('name', { required: 'A school name is required' })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.contactEmail?.message}
            {...register('contactEmail', emailRules)}
          />
          <Controller
            control={control}
            name="contactPhone"
            rules={optionalPhoneRules}
            render={({ field, fieldState }) => (
              <PhoneInput
                label="Phone"
                placeholder="1712345678"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <div className="sm:col-span-2">
            <Textarea label="Address" rows={2} error={errors.address?.message} {...register('address')} />
          </div>
        </div>
      </article>
    </form>
  )
}
