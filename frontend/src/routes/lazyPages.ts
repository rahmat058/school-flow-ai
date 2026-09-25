import { lazy } from 'react'

/**
 * Lazily-loaded pages, kept in their own module so the route tables stay plain data
 * (`react-refresh/only-export-components` requires component definitions to live in files that only
 * export components).
 *
 * The `.then` form is used because every page is a named export.
 */

// public
export const LoginPage = lazy(async () => ({ default: (await import('@/pages/auth/LoginPage')).LoginPage }))
export const SignupPage = lazy(async () => ({ default: (await import('@/pages/auth/SignupPage')).SignupPage }))
export const VerifyOtpPage = lazy(async () => ({ default: (await import('@/pages/auth/VerifyOtpPage')).VerifyOtpPage }))
export const ForgotPasswordPage = lazy(async () => ({
  default: (await import('@/pages/auth/ForgotPasswordPage')).ForgotPasswordPage,
}))
export const ResetPasswordPage = lazy(async () => ({
  default: (await import('@/pages/auth/ResetPasswordPage')).ResetPasswordPage,
}))

// private
export const DashboardPage = lazy(async () => ({ default: (await import('@/pages/DashboardPage')).DashboardPage }))
export const StudentsPage = lazy(async () => ({ default: (await import('@/pages/admin/StudentsPage')).StudentsPage }))
export const TeachersPage = lazy(async () => ({ default: (await import('@/pages/admin/TeachersPage')).TeachersPage }))
export const StudentProfilePage = lazy(async () => ({
  default: (await import('@/pages/admin/StudentProfilePage')).StudentProfilePage,
}))
export const FeesPage = lazy(async () => ({ default: (await import('@/pages/admin/FeesPage')).FeesPage }))
export const FeeCollectPage = lazy(async () => ({
  default: (await import('@/pages/admin/FeeCollectPage')).FeeCollectPage,
}))
export const PermissionsPage = lazy(async () => ({
  default: (await import('@/pages/admin/PermissionsPage')).PermissionsPage,
}))
export const NoticesPage = lazy(async () => ({ default: (await import('@/pages/NoticesPage')).NoticesPage }))
export const ChatPage = lazy(async () => ({ default: (await import('@/pages/ChatPage')).ChatPage }))
export const ExamsPage = lazy(async () => ({ default: (await import('@/pages/ExamsPage')).ExamsPage }))
export const AiAssistantPage = lazy(async () => ({
  default: (await import('@/pages/AiAssistantPage')).AiAssistantPage,
}))
export const AttendancePage = lazy(async () => ({ default: (await import('@/pages/AttendancePage')).AttendancePage }))
export const HomeworkPage = lazy(async () => ({ default: (await import('@/pages/HomeworkPage')).HomeworkPage }))
export const MaterialsPage = lazy(async () => ({ default: (await import('@/pages/MaterialsPage')).MaterialsPage }))
export const ReportsPage = lazy(async () => ({ default: (await import('@/pages/ReportsPage')).ReportsPage }))
export const MyReportsPage = lazy(async () => ({
  default: (await import('@/pages/student/MyReportsPage')).MyReportsPage,
}))
export const SettingsPage = lazy(async () => ({ default: (await import('@/pages/SettingsPage')).SettingsPage }))
export const SubjectClassPage = lazy(async () => ({
  default: (await import('@/pages/SubjectClassPage')).SubjectClassPage,
}))
export const TimetablePage = lazy(async () => ({ default: (await import('@/pages/TimetablePage')).TimetablePage }))
export const NotFoundPage = lazy(async () => ({ default: (await import('@/pages/NotFoundPage')).NotFoundPage }))
