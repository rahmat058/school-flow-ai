import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { OtpForm } from '@/features/auth/components/OtpForm'
import { paths } from '@/routes/paths'

export function VerifyOtpPage() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  // Reached without registering (e.g. after a refresh) — send them back to the form.
  if (!email) return <Navigate to={paths.signup} replace />

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Confirm the code we emailed you to activate the account."
      footer={
        <>
          Wrong address?{' '}
          <Link to={paths.signup} className="text-primary font-medium">
            Start again
          </Link>
        </>
      }>
      <OtpForm email={email} />
    </AuthShell>
  )
}
