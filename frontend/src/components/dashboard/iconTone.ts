import type { IconTone } from '@/types/dashboard'

/**
 * Tint per metric tone — the single place colour is assigned to a dashboard icon chip. Tones carry
 * meaning (success = healthy, error = needs attention), so they are not decorative.
 */
export const iconToneStyles: Record<IconTone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  error: 'bg-error-soft text-error',
  warning: 'bg-orange-soft text-warning',
}
