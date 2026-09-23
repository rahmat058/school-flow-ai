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
  attendance: '/attendance',
  fees: '/fees',
  homework: '/homework',
  exams: '/exams',
  timetable: '/timetable',
  materials: '/materials',
  notices: '/notices',
  chat: '/chat',
  reports: '/reports',
  settings: '/settings',

  notFound: '/404',
} as const

export type AppPath = (typeof paths)[keyof typeof paths]

/** `/students` → `students`, for `<RouteObject>` children of a pathless layout route. */
export function childPath(path: string): string {
  return path.replace(/^\//, '')
}
