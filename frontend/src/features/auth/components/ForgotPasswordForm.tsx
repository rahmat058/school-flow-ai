import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { env } from '@/lib/env'
import { ApiError } from '@/services/apiClient'
import { useForgotPassword } from '@/features/auth/api'
import { paths } from '@/routes/paths'

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [sentTo, setSentTo] = useState<string>()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address')
      return
    }

    setError(undefined)

    forgotPassword.mutate(
      { email: email.trim() },
      {
        // Always report success — the API must not reveal whether an account exists.
        onSuccess: (result) => setSentTo(result.email),
        onError: (mutationError) => {
          setError(mutationError instanceof ApiError ? mutationError.message : 'Could not send the reset email')
        },
      },
    )
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="error" title={error} /> : null}

      <Input
        label="Email"
        type="email"
        icon={Mail}
        autoComplete="email"
        placeholder="you@school.edu"
        hint="We will email a link to choose a new password."
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
        {forgotPassword.isPending ? <Spinner size="sm" className="text-white" label="Sending" /> : null}
        Send reset link
      </Button>
    </form>
  )
}
