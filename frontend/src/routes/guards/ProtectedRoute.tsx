import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStatus } from '@/store/auth'
import { RouteFallback } from '@/routes/RouteFallback'
import { isResolving, protectedDecision } from '@/routes/guards/guardDecision'

/**
 * Private routes. While the session handshake runs we render a spinner rather than redirecting, so a
 * page refresh does not bounce a signed-in user to the login screen.
 */
export function ProtectedRoute() {
  const status = useSessionStatus()
  const location = useLocation()

  if (isResolving(status)) return <RouteFallback />

  const decision = protectedDecision(status)
  if (decision.type === 'redirect') {
    // Remember where they were headed so login can send them back.
    return <Navigate to={decision.to} replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return <Outlet />
}
