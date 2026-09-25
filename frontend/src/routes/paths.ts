/**
 * Every route string lives here — components never hardcode paths.
 * `childPath()` strips the leading slash for nested route definitions.
 */
export const paths = {
  // public
  login: '/login',
  signup: '/signup',
  verifyOtp: '/verify-otp',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // private
  dashboard: '/',
  students: '/students',
  teachers: '/teachers',
  subjects: '/subjects',
  /** Pattern for a student's profile; build links with `studentProfilePath()`. */
  studentDetail: '/students/:id',
  attendance: '/attendance',
  fees: '/fees',
  /** Pattern for one student's collect view; build links with `feeCollectPath()`. */
  feeCollect: '/fees/collect/:studentId',
  homework: '/homework',
  exams: '/exams',
  timetable: '/timetable',
  materials: '/study-materials',
  notices: '/notices',
  chat: '/chat',
  ai: '/ai',
  permissions: '/permissions',
  reports: '/reports',
  settings: '/settings',

  notFound: '/404',
} as const

export type AppPath = (typeof paths)[keyof typeof paths]

/** `/students` → `students`, for `<RouteObject>` children of a pathless layout route. */
export function childPath(path: string): string {
  return path.replace(/^\//, '')
}

/** `/students/std_1` — the profile route for one student. */
export function studentProfilePath(id: string): string {
  return paths.studentDetail.replace(':id', id)
}

/** `/fees/collect/std_1` — the collect view for one student. */
export function feeCollectPath(id: string): string {
  return paths.feeCollect.replace(':studentId', id)
}
