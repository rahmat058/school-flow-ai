import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { KeyRound } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useResendOtp, useVerifyOtp } from '@/features/auth/api'
import { paths } from '@/routes/paths'

interface OtpFormProps {
  email: string
}

interface OtpFormValues {
  code: string
}

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

/** Registration OTP step. A successful verification activates the account, then the user signs in. */
export function OtpForm({ email }: OtpFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const verifyOtp = useVerifyOtp()
  const resendOtp = useResendOtp()

  const [resendAt, setResendAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    defaultValues: { code: '' },
    mode: 'onTouched',
  })

  // Tick while a resend cooldown is running; setState happens inside the interval callback.
  useEffect(() => {
    if (resendAt === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [resendAt])

  const secondsLeft = resendAt === null ? 0 : Math.max(0, Math.ceil((resendAt - now) / 1000))

  const codeField = register('code', {
    required: `Enter the ${CODE_LENGTH}-digit code from your email`,
    minLength: { value: CODE_LENGTH, message: `The code is ${CODE_LENGTH} digits` },
  })

  const onSubmit: SubmitHandler<OtpFormValues> = async (values) => {
    try {
      await verifyOtp.mutateAsync({ email, code: values.code, purpose: 'REGISTER' })
      toast({ tone: 'success', title: 'Account verified', description: 'You can sign in now.' })
      navigate(paths.login, { replace: true, state: { email } })
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message: error instanceof ApiError ? error.message : 'Could not verify the code',
      })
    }
  }

  function handleResend() {
    resendOtp.mutate(email, {
      onSuccess: () => {
        setResendAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
        toast({ tone: 'info', title: 'Code sent', description: `We emailed a new code to ${email}.` })
      },
      onError: (mutationError) => {
        setError('root.serverError', {
          type: 'server',
          message: mutationError instanceof ApiError ? mutationError.message : 'Could not resend the code',
        })
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

      <Input
        label="Verification code"
        icon={KeyRound}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        placeholder="123456"
        hint={`We sent a ${CODE_LENGTH}-digit code to ${email}. It expires in 10 minutes.`}
        error={errors.code?.message}
        className="font-mono tracking-[0.3em]"
        {...codeField}
        onChange={(event) => {
          // Digits only, capped at CODE_LENGTH — then hand the event back to react-hook-form.
          event.target.value = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)
          void codeField.onChange(event)
        }}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" className="text-white" label="Verifying" /> : null}
        Verify account
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={resendOtp.isPending || secondsLeft > 0}
        onClick={handleResend}>
        {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
      </Button>
    </form>
  )
}
