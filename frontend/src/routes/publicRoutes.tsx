import type { RouteObject } from 'react-router-dom'
import { PublicOnlyRoute } from '@/routes/guards/PublicOnlyRoute'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage, VerifyOtpPage } from '@/routes/lazyPages'
import { childPath, paths } from '@/routes/paths'

/** Unauthenticated routes. `PublicOnlyRoute` redirects a signed-in visitor to their dashboard. */
export const publicRoutes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: childPath(paths.login), element: <LoginPage /> },
      { path: childPath(paths.signup), element: <SignupPage /> },
      { path: childPath(paths.verifyOtp), element: <VerifyOtpPage /> },
      { path: childPath(paths.forgotPassword), element: <ForgotPasswordPage /> },
      { path: childPath(paths.resetPassword), element: <ResetPasswordPage /> },
    ],
  },
]
