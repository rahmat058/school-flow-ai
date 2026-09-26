/**
 * Validation rules shared by every form. A rule lives here so a fix in one form cannot leave
 * another form validating — or wording — something different.
 *
 * These stay plain literals rather than annotated `RegisterOptions`: that type is a union resolved
 * against a specific form's fields, so annotating it here makes it fit none of them.
 */

import { countryForValue, nationalDigitsOf } from '@/lib/countries'

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

/**
 * E.164 — the shape `PhoneInput` hands back (`+`, then the 7–15 digits of the country calling code
 * plus the national number). A loose shape check; `phoneLengthError` below narrows it per country.
 */
export const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/

/**
 * Country-aware length check: the national part must fit the country's own range (`lib/countries.ts`).
 * `PhoneInput` caps typing at that maximum, so this is what catches a value that arrives already
 * wrong — too long, or too short for the country — from the API, a paste, or a country the user has
 * since switched away from.
 */
function phoneLengthError(value: string): string | true {
  const country = countryForValue(value)
  if (!country) return true

  const national = nationalDigitsOf(value, country).length
  if (national >= country.minLength && national <= country.maxLength) return true

  return country.minLength === country.maxLength
    ? `Enter a ${country.maxLength}-digit number`
    : `Enter ${country.minLength}–${country.maxLength} digits`
}

export const phoneRules = {
  required: 'Phone number is required',
  pattern: { value: PHONE_PATTERN, message: 'Enter a valid phone number' },
  validate: (value?: string) => (!value ? true : phoneLengthError(value)),
} as const

/** For a phone field that may be left blank: empty passes, anything filled must be a valid number. */
export const optionalPhoneRules = {
  validate: (value?: string) => {
    if (!value) return true
    if (!PHONE_PATTERN.test(value)) return 'Enter a valid phone number'
    return phoneLengthError(value)
  },
} as const

/**
 * A study material's file rules (`docs/backend/Design.md`): PDF/JPG/PNG/DOCX up to 10MB. The form and
 * the mock's upload endpoint read the same list and the same check, so the client cannot accept a file
 * the API would refuse.
 */
export const MATERIAL_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx'] as const

export const MATERIAL_MAX_BYTES = 10 * 1024 * 1024

export const MATERIAL_ACCEPT = MATERIAL_FILE_EXTENSIONS.map((extension) => `.${extension}`).join(',')

/** Structurally a `File`, so the mock's upload endpoint can apply the same rule to the received part. */
export function materialFileError(file: { name: string; size: number } | null | undefined): string | null {
  if (!file) return 'Choose a file to upload'

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!MATERIAL_FILE_EXTENSIONS.includes(extension as (typeof MATERIAL_FILE_EXTENSIONS)[number])) {
    return 'Upload a PDF, JPG, PNG or DOCX file'
  }

  if (file.size > MATERIAL_MAX_BYTES) return 'Files must be 10MB or smaller'

  return null
}
