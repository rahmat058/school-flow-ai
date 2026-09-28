/** The password-reset link lives 30 minutes — shorter than the 24-hour verification link. */
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

export function passwordResetExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + PASSWORD_RESET_TTL_MS);
}
