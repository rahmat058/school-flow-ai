import { create } from 'zustand'
import type { AuthSession, AuthUser } from '@/types/auth'

/**
 * Client-only auth state (never a cache for server data — see Rules.md).
 *
 * The access token lives in memory only: it is lost on reload on purpose, and the session is
 * restored by a refresh call against the httpOnly cookie (see `features/auth/api.ts`).
 */
export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  status: SessionStatus
  setSession: (session: AuthSession) => void
  setStatus: (status: SessionStatus) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setSession: ({ user, accessToken }) => set({ user, accessToken, status: 'authenticated' }),
  setStatus: (status) => set({ status }),
  clearSession: () => set({ user: null, accessToken: null, status: 'anonymous' }),
}))

/** Read the token outside React (axios interceptor). */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken
}

export function useCurrentUser(): AuthUser | null {
  return useAuthStore((state) => state.user)
}

export function useSessionStatus(): SessionStatus {
  return useAuthStore((state) => state.status)
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.status === 'authenticated')
}
