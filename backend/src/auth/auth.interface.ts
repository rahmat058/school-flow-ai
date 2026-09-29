import type { Role } from '../common/enums/role.enum.js';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string;
  isVerified: boolean;
  profileId: string | null;
  firstName: string;
  lastName: string;
  classId: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  email: string;
  role: Role;
}

export interface AuthSchool {
  id: string;
  name: string;
  slug: string;
}

export interface AuthProfile extends AuthUser {
  school: AuthSchool | null;
}

export interface LogoutResult {
  loggedOut: true;
}

export interface PasswordResetRequested {
  email: string;
  expiresAt: string;
}

export interface PasswordReset {
  reset: true;
}

export interface InviteVerified {
  verified: true;
}

export interface InviteSent {
  email: string;
  expiresAt: string;
}
