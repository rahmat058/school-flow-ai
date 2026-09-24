/**
 * Validation rules shared by every form. A rule lives here so a fix in one form cannot leave
 * another form validating — or wording — something different.
 *
 * These stay plain literals rather than annotated `RegisterOptions`: that type is a union resolved
 * against a specific form's fields, so annotating it here makes it fit none of them.
 */

/** Deliberately permissive: enough to catch a typo, not a spec implementation. */
export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export const MIN_PASSWORD_LENGTH = 8

export const emailRules = {
  required: 'Email is required',
  pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
} as const

export const passwordRules = {
  required: 'Password is required',
  minLength: { value: MIN_PASSWORD_LENGTH, message: `Use at least ${MIN_PASSWORD_LENGTH} characters` },
} as const

/** The helper line under a password field, so the number is stated the same way everywhere. */
export const passwordHint = `At least ${MIN_PASSWORD_LENGTH} characters.`
