import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStatus } from '@/store/auth'
import { RouteFallback } from '@/routes/RouteFallback'
import { isResolving, publicOnlyDecision } from '@/routes/guards/guardDecision'

/** Keeps signed-in users out of the auth screens (no "back to login" flash after signing in). */
export function PublicOnlyRoute() {
  const status = useSessionStatus()

  if (isResolving(status)) return <RouteFallback />

  const decision = publicOnlyDecision(status)
  if (decision.type === 'redirect') return <Navigate to={decision.to} replace />

  return <Outlet />
}
