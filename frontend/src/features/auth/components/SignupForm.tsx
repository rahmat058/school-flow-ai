import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Lock, Mail, MapPin, Phone, User } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useRegisterSchool } from '@/features/auth/api'
import { paths } from '@/routes/paths'

interface SignupErrors {
  schoolName?: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  adminFirstName?: string
  adminLastName?: string
  email?: string
  password?: string
  form?: string
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const MIN_PASSWORD = 8

export function SignupForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const registerSchool = useRegisterSchool()

  const [form, setForm] = useState({
    schoolName: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    adminFirstName: '',
    adminLastName: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<SignupErrors>({})

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate(): SignupErrors {
    const next: SignupErrors = {}
    if (!form.schoolName.trim()) next.schoolName = 'School name is required'
    if (!form.address.trim()) next.address = 'Address is required'
    if (!form.contactEmail.trim()) next.contactEmail = 'Contact email is required'
    else if (!EMAIL_PATTERN.test(form.contactEmail.trim())) next.contactEmail = 'Enter a valid email address'
    if (!form.contactPhone.trim()) next.contactPhone = 'Contact number is required'
    if (!form.adminFirstName.trim()) next.adminFirstName = 'First name is required'
    if (!form.adminLastName.trim()) next.adminLastName = 'Last name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (form.password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters`
    return next
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    registerSchool.mutate(
      {
        schoolName: form.schoolName.trim(),
        address: form.address.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        adminFirstName: form.adminFirstName.trim(),
        adminLastName: form.adminLastName.trim(),
        email: form.email.trim(),
        password: form.password,
      },
      {
        onSuccess: (result) => {
          toast({ tone: 'success', title: 'School created', description: 'Check the OTP to activate the account.' })
          navigate(paths.verifyOtp, { state: { email: result.email } })
        },
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : 'Could not create the school'
          setErrors({ form: message })
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.form ? <Alert tone="error" title={errors.form} /> : null}

      <fieldset className="space-y-4">
        <legend className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">School</legend>
        <Input
          label="School name"
          icon={Building2}
          placeholder="Bright Future School"
          value={form.schoolName}
          error={errors.schoolName}
          onChange={(event) => update('schoolName', event.target.value)}
        />
        <Input
          label="Address"
          icon={MapPin}
          placeholder="House, road, area, city"
          value={form.address}
          error={errors.address}
          onChange={(event) => update('address', event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contact email"
            type="email"
            icon={Mail}
            value={form.contactEmail}
            error={errors.contactEmail}
            onChange={(event) => update('contactEmail', event.target.value)}
          />
          <Input
            label="Contact number"
            icon={Phone}
            placeholder="+880 1700 000000"
            value={form.contactPhone}
            error={errors.contactPhone}
            onChange={(event) => update('contactPhone', event.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-ink-subtle text-[11px] font-medium tracking-[0.04em] uppercase">Administrator</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            icon={User}
            value={form.adminFirstName}
            error={errors.adminFirstName}
            onChange={(event) => update('adminFirstName', event.target.value)}
          />
          <Input
            label="Last name"
            icon={User}
            value={form.adminLastName}
            error={errors.adminLastName}
            onChange={(event) => update('adminLastName', event.target.value)}
          />
        </div>
        <Input
          label="Work email"
          type="email"
          icon={Mail}
          hint="Used to sign in and to receive the verification code."
          value={form.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          hint={`At least ${MIN_PASSWORD} characters.`}
          value={form.password}
          error={errors.password}
          onChange={(event) => update('password', event.target.value)}
        />
      </fieldset>

      <Button type="submit" className="w-full" disabled={registerSchool.isPending}>
        {registerSchool.isPending ? <Spinner size="sm" className="text-white" label="Creating school" /> : null}
        Create school
      </Button>
    </form>
  )
}
