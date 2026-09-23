import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/types/auth'
import { useCurrentUser } from '@/store/auth'
import { roleDecision } from '@/routes/guards/guardDecision'

interface RoleGuardProps {
  allow: Role[]
}

/** Restricts a route group to the given roles; everyone else lands back on their dashboard. */
export function RoleGuard({ allow }: RoleGuardProps) {
  const user = useCurrentUser()

  const decision = roleDecision(user?.role, allow)
  if (decision.type === 'redirect') return <Navigate to={decision.to} replace />

  return <Outlet />
}
