import { AdminDashboard } from '@/components/dashboard/admin/AdminDashboard'
import { StudentDashboard } from '@/components/dashboard/student/StudentDashboard'
import { useCurrentUser } from '@/store/auth'

/** The role decides which home opens: a student reads their own day, everyone else the school's. */
export function DashboardPage() {
  const user = useCurrentUser()

  if (user?.role === 'STUDENT') return <StudentDashboard />

  return <AdminDashboard />
}
