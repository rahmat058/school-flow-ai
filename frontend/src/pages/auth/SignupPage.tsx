import { Link } from 'react-router-dom'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { paths } from '@/routes/paths'

export function SignupPage() {
  return (
    <AuthShell
      title="Register your school"
      subtitle="Create the school and its administrator account, then verify your email."
      footer={
        <>
          Already registered?{' '}
          <Link to={paths.login} className="text-primary font-medium">
            Sign in
          </Link>
        </>
      }>
      <SignupForm />
    </AuthShell>
  )
}
