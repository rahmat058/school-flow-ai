import { describe, expect, it } from 'vitest';
import {
  VERIFICATION_TTL_MS,
  createVerificationToken,
  hashToken,
  isExpired,
  verificationExpiry,
} from './verification-token.util.js';

describe('verification token', () => {
  it('creates a 32-byte hex token', () => {
    const token = createVerificationToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(createVerificationToken()).not.toBe(token);
  });

  it('hashes deterministically without exposing the token', () => {
    const token = createVerificationToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).not.toContain(token);
  });

  it('expires 24 hours after it is issued', () => {
    const issued = new Date('2026-09-26T00:00:00.000Z');
    const expiry = verificationExpiry(issued);
    expect(expiry.getTime() - issued.getTime()).toBe(VERIFICATION_TTL_MS);
    expect(expiry.toISOString()).toBe('2026-09-27T00:00:00.000Z');
  });

  it('treats a missing or past expiry as expired', () => {
    expect(isExpired(null)).toBe(true);
    expect(isExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(isExpired(verificationExpiry().toISOString())).toBe(false);
  });
});
