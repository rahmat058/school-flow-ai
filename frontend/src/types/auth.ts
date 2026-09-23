/** The four roles, matching the backend `role` enum. */
export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

/** Matches the backend `otp_purpose` enum. */
export type OtpPurpose = 'REGISTER' | 'RESET_PASSWORD'

/** Session user — `passwordHash` is never present (stripped server-side). */
export interface AuthUser {
  id: string
  email: string
  role: Role
  schoolId: string
  isVerified: boolean
  /** Row id in the matching profile table (`teachers` / `students` / `parents`); null for admins. */
  profileId: string | null
  firstName: string
  lastName: string
  /** Owning class for students. */
  classId: string | null
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  /** ISO-8601 — access tokens live 15 minutes per the backend contract. */
  expiresAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterSchoolPayload {
  schoolName: string
  address: string
  contactEmail: string
  contactPhone: string
  adminFirstName: string
  adminLastName: string
  email: string
  password: string
}

export interface OtpChallenge {
  email: string
  purpose: OtpPurpose
  expiresAt: string
}

export interface VerifyOtpPayload {
  email: string
  code: string
  purpose: OtpPurpose
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

/** Signed-in user in their own role's home. */
export const roleHome: Record<Role, string> = {
  ADMIN: '/',
  TEACHER: '/',
  STUDENT: '/',
  PARENT: '/',
}
