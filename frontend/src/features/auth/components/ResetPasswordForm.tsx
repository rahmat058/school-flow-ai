import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Lock } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Spinner } from '@/components/ui/Spinner'
import { passwordHint, passwordRules } from '@/lib/validation'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useResetPassword } from '@/features/auth/api'
import { paths } from '@/routes/paths'

interface ResetPasswordFormValues {
  password: string
  confirmPassword: string
}

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const resetPassword = useResetPassword()

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  })

  const token = searchParams.get('token') ?? ''

  // Every hook above this line runs unconditionally; the token check only gates the markup.
  if (!token) {
    return (
      <div className="space-y-4">
        <Alert tone="error" title="This link is incomplete">
          The reset link is missing its token. Request a new email and use the link from there.
        </Alert>
        <Button variant="secondary" className="w-full" onClick={() => navigate(paths.forgotPassword)}>
          Request a new link
        </Button>
      </div>
    )
  }

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (values) => {
    try {
      await resetPassword.mutateAsync({ token, password: values.password })
      toast({ tone: 'success', title: 'Password updated', description: 'Sign in with your new password.' })
      navigate(paths.login, { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not reset the password'
      // Validation details from the API take precedence over the summary message.
      const details = error instanceof ApiError ? error.details.join(', ') : ''
      setError('root.serverError', { type: 'server', message: details || message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

      <PasswordInput
        label="New password"
        icon={Lock}
        autoComplete="new-password"
        hint={passwordHint}
        error={errors.password?.message}
        {...register('password', passwordRules)}
      />

      <PasswordInput
        label="Confirm new password"
        icon={Lock}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Confirm the new password',
          validate: (value) => value === getValues('password') || 'Passwords do not match',
        })}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
        Update password
      </Button>
    </form>
  )
}
