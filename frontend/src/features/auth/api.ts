import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { post } from '@/services/apiClient'
import { useAuthStore } from '@/store/auth'
import type {
  AuthSession,
  ForgotPasswordPayload,
  LoginPayload,
  OtpChallenge,
  RegisterSchoolPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
} from '@/types/auth'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

/** Signs in and stores the session (access token in memory only). */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: async (payload: LoginPayload) => (await post<AuthSession>('/auth/login', payload)).data,
    onSuccess: (session) => setSession(session),
  })
}

/** Step 1 of onboarding: creates the school + admin and triggers the OTP email. */
export function useRegisterSchool() {
  return useMutation({
    mutationFn: async (payload: RegisterSchoolPayload) => {
      const result = await post<{ schoolId: string; email: string; otp: OtpChallenge }>('/schools/register', payload)
      return result.data
    },
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (payload: VerifyOtpPayload) => {
      const result = await post<{ email: string; verified: boolean }>('/schools/verify-otp', payload)
      return result.data
    },
  })
}

export function useResendOtp() {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await post<{ sent: boolean; expiresAt: string }>('/schools/resend-otp', { email })
      return result.data
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      const result = await post<{ email: string; expiresAt: string }>('/auth/forgot-password', payload)
      return result.data
    },
  })
}

export function useResetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      const result = await post<{ reset: boolean }>('/auth/reset-password', payload)
      return result.data
    },
    onSuccess: () => queryClient.clear(),
  })
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await post<{ loggedOut: boolean }>('/auth/logout')
    },
    // Clear locally even if the call fails — the user asked to sign out.
    onSettled: () => {
      clearSession()
      queryClient.clear()
    },
  })
}

/**
 * One-shot session handshake on app boot. The access token is memory-only, so a reload has to trade
 * the httpOnly refresh cookie for a new one; guards render a spinner while `status === 'loading'`.
 *
 * This is a handshake rather than cached server state, so it calls the client directly instead of
 * going through a query.
 */
export function useSessionBootstrap(): void {
  const status = useAuthStore((state) => state.status)
  const setSession = useAuthStore((state) => state.setSession)
  const setStatus = useAuthStore((state) => state.setStatus)

  useEffect(() => {
    if (status !== 'loading') return

    let cancelled = false

    async function restore() {
      try {
        const { data } = await post<AuthSession>('/auth/refresh')
        if (!cancelled) setSession(data)
      } catch {
        if (!cancelled) setStatus('anonymous')
      }
    }

    void restore()

    return () => {
      cancelled = true
    }
  }, [status, setSession, setStatus])
}
