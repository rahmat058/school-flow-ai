import { createHash, randomBytes } from 'node:crypto';

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function createVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verificationExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + VERIFICATION_TTL_MS);
}

export function isExpired(expiresAt: string | null): boolean {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now();
}
