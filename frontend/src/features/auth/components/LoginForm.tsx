import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Lock, Mail } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useLogin } from '@/features/auth/api'
import { paths } from '@/routes/paths'

interface LoginFormValues {
  email: string
  password: string
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const login = useLogin()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  // Where the guard interrupted them, if anywhere.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? paths.dashboard

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    try {
      const session = await login.mutateAsync({ email: values.email.trim(), password: values.password })
      toast({ tone: 'success', title: `Welcome back, ${session.user.firstName}` })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to sign in right now'
      // Surfaces the API's error code message above the form.
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Sign in failed', description: message })
    }
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
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
        })}
      />

      <Input
        label="Password"
        type="password"
        icon={Lock}
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password', { required: 'Password is required' })}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" className="text-white" label="Signing in" /> : null}
        Sign in
      </Button>
    </form>
  )
}
