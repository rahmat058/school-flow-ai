import { Link } from 'react-router-dom'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { paths } from '@/routes/paths'

export function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your school account to reach your dashboard."
      footer={
        <>
          New school?{' '}
          <Link to={paths.signup} className="text-primary font-medium">
            Create an account
          </Link>
        </>
      }>
      <div className="space-y-4">
        <LoginForm />
        <p className="text-center">
          <Link to={paths.forgotPassword} className="text-ink-muted hover:text-primary text-[13px]">
            Forgot your password?
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
