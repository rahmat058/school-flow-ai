import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useResetPassword } from '@/features/auth/api'
import { paths } from '@/routes/paths'

const MIN_PASSWORD = 8

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const resetPassword = useResetPassword()

  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; form?: string }>({})

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: typeof errors = {}
    if (password.length < MIN_PASSWORD) nextErrors.password = `Use at least ${MIN_PASSWORD} characters`
    if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    resetPassword.mutate(
      { token, password },
      {
        onSuccess: () => {
          toast({ tone: 'success', title: 'Password updated', description: 'Sign in with your new password.' })
          navigate(paths.login, { replace: true })
        },
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : 'Could not reset the password'
          const details = error instanceof ApiError ? error.details.join(', ') : ''
          setErrors({ form: details || message })
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.form ? <Alert tone="error" title={errors.form} /> : null}

      <Input
        label="New password"
        type="password"
        icon={Lock}
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD} characters.`}
        value={password}
        error={errors.password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Input
        label="Confirm new password"
        type="password"
        icon={Lock}
        autoComplete="new-password"
        value={confirmPassword}
        error={errors.confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
        {resetPassword.isPending ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
        Update password
      </Button>
    </form>
  )
}
