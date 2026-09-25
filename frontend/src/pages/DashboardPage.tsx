import { AdminDashboard } from '@/components/dashboard/admin/AdminDashboard'
import { ParentDashboard } from '@/components/dashboard/parent/ParentDashboard'
import { StudentDashboard } from '@/components/dashboard/student/StudentDashboard'
import { useCurrentUser } from '@/store/auth'

/**
 * The role decides which home opens: a student reads their own day, a guardian one of their children,
 * and staff the school-wide view.
 */
export function DashboardPage() {
  const user = useCurrentUser()

  if (user?.role === 'STUDENT') return <StudentDashboard />
  if (user?.role === 'PARENT') return <ParentDashboard />

  return <AdminDashboard />
}
