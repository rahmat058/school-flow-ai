import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

/** Registration OTP step. A successful verification activates the account, then the user signs in. */
export function OtpForm({ email }: OtpFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const verifyOtp = useVerifyOtp()
  const resendOtp = useResendOtp()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [resendAt, setResendAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // Tick while a resend cooldown is running; setState happens inside the interval callback.
  useEffect(() => {
    if (resendAt === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [resendAt])

  const secondsLeft = resendAt === null ? 0 : Math.max(0, Math.ceil((resendAt - now) / 1000))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (code.trim().length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code from your email`)
      return
    }

    setError(undefined)

    verifyOtp.mutate(
      { email, code: code.trim(), purpose: 'REGISTER' },
      {
        onSuccess: () => {
          toast({ tone: 'success', title: 'Account verified', description: 'You can sign in now.' })
          navigate(paths.login, { replace: true, state: { email } })
        },
        onError: (mutationError) => {
          setError(mutationError instanceof ApiError ? mutationError.message : 'Could not verify the code')
        },
      },
    )
  }

  function handleResend() {
    resendOtp.mutate(email, {
      onSuccess: () => {
        setResendAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
        toast({ tone: 'info', title: 'Code sent', description: `We emailed a new code to ${email}.` })
      },
      onError: (mutationError) => {
        setError(mutationError instanceof ApiError ? mutationError.message : 'Could not resend the code')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="error" title={error} /> : null}

      <Input
        label="Verification code"
        icon={KeyRound}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        placeholder="123456"
        hint={`We sent a ${CODE_LENGTH}-digit code to ${email}. It expires in 10 minutes.`}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
        className="font-mono tracking-[0.3em]"
      />

      <Button type="submit" className="w-full" disabled={verifyOtp.isPending}>
        {verifyOtp.isPending ? <Spinner size="sm" className="text-white" label="Verifying" /> : null}
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
