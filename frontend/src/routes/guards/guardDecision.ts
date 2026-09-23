import type { Role } from '@/types/auth'
import type { SessionStatus } from '@/store/auth'
import { paths } from '@/routes/paths'

/**
 * The guards' decision logic, kept separate from their rendering so it can be tested without a DOM
 * (`react-router`'s `<Navigate>` is a no-op during a static render, and zustand v5 serves its
 * *initial* state to server renders, so a rendered route tree cannot be asserted on).
 */
export type GuardDecision = { type: 'allow' } | { type: 'redirect'; to: string }

/** The session handshake has not finished — show a spinner instead of deciding either way. */
export function isResolving(status: SessionStatus): boolean {
  return status === 'loading'
}

/** Private routes: anonymous visitors go to the login screen. */
export function protectedDecision(status: SessionStatus): GuardDecision {
  return status === 'anonymous' ? { type: 'redirect', to: paths.login } : { type: 'allow' }
}

/** Auth screens: a signed-in user is sent to their dashboard instead. */
export function publicOnlyDecision(status: SessionStatus): GuardDecision {
  return status === 'authenticated' ? { type: 'redirect', to: paths.dashboard } : { type: 'allow' }
}

/** Role-restricted groups: signed out → login, wrong role → dashboard. */
export function roleDecision(role: Role | null | undefined, allow: Role[]): GuardDecision {
  if (!role) return { type: 'redirect', to: paths.login }
  return allow.includes(role) ? { type: 'allow' } : { type: 'redirect', to: paths.dashboard }
}
