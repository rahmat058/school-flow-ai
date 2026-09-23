import { Link } from 'react-router-dom'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'
import { paths } from '@/routes/paths'

export function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a link to choose a new password."
      footer={
        <Link to={paths.login} className="text-primary font-medium">
          Back to sign in
        </Link>
      }>
      <ForgotPasswordForm />
    </AuthShell>
  )
}
