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
