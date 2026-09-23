import { Link } from 'react-router-dom'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import { paths } from '@/routes/paths'

export function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you have not used before."
      footer={
        <Link to={paths.login} className="text-primary font-medium">
          Back to sign in
        </Link>
      }>
      <ResetPasswordForm />
    </AuthShell>
  )
}
