import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Building2, Lock, Mail, MapPin, Phone, User } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Spinner } from '@/components/ui/Spinner'
import { emailRules, passwordHint, passwordRules } from '@/lib/validation'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useRegisterSchool } from '@/features/auth/api'
import { paths } from '@/routes/paths'

interface SignupFormValues {
  schoolName: string
  address: string
  contactEmail: string
  contactPhone: string
  adminFirstName: string
  adminLastName: string
  email: string
  password: string
}

export function SignupForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const registerSchool = useRegisterSchool()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      schoolName: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      adminFirstName: '',
      adminLastName: '',
      email: '',
      password: '',
    },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<SignupFormValues> = async (values) => {
    try {
      const result = await registerSchool.mutateAsync({
        schoolName: values.schoolName.trim(),
        address: values.address.trim(),
        contactEmail: values.contactEmail.trim(),
        contactPhone: values.contactPhone.trim(),
        adminFirstName: values.adminFirstName.trim(),
        adminLastName: values.adminLastName.trim(),
        email: values.email.trim(),
        password: values.password,
      })

      toast({ tone: 'success', title: 'School created', description: 'Check the OTP to activate the account.' })
      navigate(paths.verifyOtp, { state: { email: result.email } })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not create the school'
      setError('root.serverError', { type: 'server', message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

      <fieldset className="space-y-4">
        <legend className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">School</legend>
        <Input
          label="School name"
          icon={Building2}
          placeholder="Bright Future School"
          error={errors.schoolName?.message}
          {...register('schoolName', { required: 'School name is required' })}
        />
        <Input
          label="Address"
          icon={MapPin}
          placeholder="House, road, area, city"
          error={errors.address?.message}
          {...register('address', { required: 'Address is required' })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contact email"
            type="email"
            icon={Mail}
            error={errors.contactEmail?.message}
            {...register('contactEmail', emailRules)}
          />
          <Input
            label="Contact number"
            icon={Phone}
            placeholder="+880 1700 000000"
            error={errors.contactPhone?.message}
            {...register('contactPhone', { required: 'Contact number is required' })}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">Administrator</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            icon={User}
            error={errors.adminFirstName?.message}
            {...register('adminFirstName', { required: 'First name is required' })}
          />
          <Input
            label="Last name"
            icon={User}
            error={errors.adminLastName?.message}
            {...register('adminLastName', { required: 'Last name is required' })}
          />
        </div>
        <Input
          label="Work email"
          type="email"
          icon={Mail}
          hint="Used to sign in and to receive the verification code."
          error={errors.email?.message}
          {...register('email', emailRules)}
        />
        <PasswordInput
          label="Password"
          icon={Lock}
          hint={passwordHint}
          error={errors.password?.message}
          {...register('password', passwordRules)}
        />
      </fieldset>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" className="text-white" label="Creating school" /> : null}
        Create school
      </Button>
    </form>
  )
}
