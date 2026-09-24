import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Mail } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { env } from '@/lib/env'
import { emailRules } from '@/lib/validation'
import { ApiError } from '@/services/apiClient'
import { useForgotPassword } from '@/features/auth/api'
import { paths } from '@/routes/paths'

interface ForgotPasswordFormValues {
  email: string
}

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword()
  const [sentTo, setSentTo] = useState<string>()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: '' },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (values) => {
    try {
      // Always report success — the API must not reveal whether an account exists.
      const result = await forgotPassword.mutateAsync({ email: values.email.trim() })
      setSentTo(result.email)
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message: error instanceof ApiError ? error.message : 'Could not send the reset email',
      })
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Check your inbox">
          If an account exists for {sentTo}, a reset link is on its way. The link expires in 30 minutes.
        </Alert>

        {env.enableMocks ? (
          <Alert tone="info" title="Demo shortcut">
            No email is really sent while the API is mocked.{' '}
            <Link to={`${paths.resetPassword}?token=demo-reset-token`} className="text-primary font-medium">
              Open the reset form
            </Link>
            .
          </Alert>
        ) : null}

        <Button variant="secondary" className="w-full" onClick={() => setSentTo(undefined)}>
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

      <Input
        label="Email"
        type="email"
        icon={Mail}
        autoComplete="email"
        placeholder="you@school.edu"
        hint="We will email a link to choose a new password."
        error={errors.email?.message}
        {...register('email', emailRules)}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" className="text-white" label="Sending" /> : null}
        Send reset link
      </Button>
    </form>
  )
}
