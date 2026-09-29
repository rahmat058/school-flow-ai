import { randomBytes, randomInt } from 'node:crypto';

/**
 * A 6-digit numeric code (zero-padded) — the one-time value an invite email
 * carries. Hashed with `hashToken` before it is stored on `users`.
 */
export function createInviteCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** A 12-character temporary password for an invited login, emailed alongside the code. */
export function createTemporaryPassword(): string {
  return randomBytes(9).toString('base64url');
}
