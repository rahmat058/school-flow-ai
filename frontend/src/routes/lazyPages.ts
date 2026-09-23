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
export const StudentProfilePage = lazy(async () => ({
  default: (await import('@/pages/admin/StudentProfilePage')).StudentProfilePage,
}))
export const InvoicesPage = lazy(async () => ({ default: (await import('@/pages/admin/InvoicesPage')).InvoicesPage }))
export const NoticesPage = lazy(async () => ({ default: (await import('@/pages/NoticesPage')).NoticesPage }))
export const NotFoundPage = lazy(async () => ({ default: (await import('@/pages/NotFoundPage')).NotFoundPage }))
