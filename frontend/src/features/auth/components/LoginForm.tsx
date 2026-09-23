import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useLogin } from '@/features/auth/api'
import { paths } from '@/routes/paths'

interface FieldErrors {
  email?: string
  password?: string
  form?: string
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const login = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  // Where the guard interrupted them, if anywhere.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? paths.dashboard

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {}
    if (!email.trim()) nextErrors.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address'
    if (!password) nextErrors.password = 'Password is required'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (session) => {
          toast({ tone: 'success', title: `Welcome back, ${session.user.firstName}` })
          navigate(redirectTo, { replace: true })
        },
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : 'Unable to sign in right now'
          setErrors({ form: message })
          toast({ tone: 'error', title: 'Sign in failed', description: message })
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.form ? <Alert tone="error" title={errors.form} /> : null}

      <Input
        label="Email"
        type="email"
        icon={Mail}
        autoComplete="email"
        placeholder="you@school.edu"
        value={email}
        error={errors.email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Input
        label="Password"
        type="password"
        icon={Lock}
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        error={errors.password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? <Spinner size="sm" className="text-white" label="Signing in" /> : null}
        Sign in
      </Button>
    </form>
  )
}
