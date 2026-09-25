import { ClassAttendancePanel } from '@/features/attendance/components/admin/ClassAttendancePanel'
import { MyAttendancePanel } from '@/features/attendance/components/student/MyAttendancePanel'
import { useCurrentUser } from '@/store/auth'

/**
 * Everyone has a register: staff read a class's month, a student their own and a guardian their
 * child's. The role picks the panel, so each loads only the payload it renders.
 */
export function AttendancePage() {
  const user = useCurrentUser()
  const staff = user?.role === 'ADMIN' || user?.role === 'TEACHER'

  return staff ? <ClassAttendancePanel /> : <MyAttendancePanel />
}
