import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { ArrowRight, BookOpen, GraduationCap, Lock, Mail, ShieldCheck, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'
import { emailRules } from '@/lib/validation'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { demoAccounts } from '@/data/users'
import { useLogin } from '@/features/auth/api'
import { paths } from '@/routes/paths'
import type { Role } from '@/types/auth'

interface LoginFormValues {
  email: string
  password: string
}

const ROLE_OPTIONS = [
  { role: 'ADMIN', label: 'Admin', icon: ShieldCheck },
  { role: 'TEACHER', label: 'Teacher', icon: GraduationCap },
  { role: 'STUDENT', label: 'Student', icon: BookOpen },
  { role: 'PARENT', label: 'Parent', icon: Users },
] as const

function labelFor(role: Role): string {
  return ROLE_OPTIONS.find((option) => option.role === role)?.label ?? role
}

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const login = useLogin()
  const [role, setRole] = useState<Role>('ADMIN')

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  // Where the guard interrupted them, if anywhere.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? paths.dashboard
  const roleLabel = labelFor(role)

  /**
   * Choosing a role is a portal choice, not an authorisation: the account's own role still decides
   * what opens. In mock mode it also fills that role's sample credentials — what the demo panel
   * used to do by hand.
   */
  function chooseRole(next: Role) {
    setRole(next)

    if (!env.enableMocks) return
    const account = demoAccounts.find((candidate) => candidate.role === next)
    if (!account) return

    setValue('email', account.email, { shouldValidate: false })
    setValue('password', account.password, { shouldValidate: false })
  }

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    try {
      const session = await login.mutateAsync({ email: values.email.trim(), password: values.password })

      if (session.user.role === role) {
        toast({ tone: 'success', title: `Welcome back, ${session.user.firstName}` })
      } else {
        // Never let the picker imply access the account does not have.
        const actualRole = labelFor(session.user.role)
        toast({
          tone: 'info',
          title: `Signed in as ${actualRole}`,
          description: `You selected ${roleLabel}, but this account is a ${actualRole} — the account's role decides what opens.`,
        })
      }

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
        {...register('email', emailRules)}
      />

      <PasswordInput
        label="Password"
        icon={Lock}
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password', { required: 'Password is required' })}
      />

      <p
        role="status"
        className="bg-primary-soft text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium">
        <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />
        Signing in as {roleLabel}
      </p>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" className="text-white" label="Signing in" /> : null}
        Sign in as {roleLabel}
        <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
      </Button>

      <div className="space-y-2 pt-1">
        <p className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Select role</p>

        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon
            const selected = option.role === role

            return (
              <button
                key={option.role}
                type="button"
                onClick={() => chooseRole(option.role)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors',
                  selected
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line text-ink-muted hover:bg-primary-soft hover:text-primary',
                )}>
                <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </form>
  )
}
