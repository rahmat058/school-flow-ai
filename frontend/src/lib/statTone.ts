import type { IconTone } from '@/types/dashboard'

/**
 * The fill per metric tone for a **key-metric card** — a light-to-deep gradient, because such a
 * card's colour **is** its meaning (success = healthy, error = needs attention, warning = due soon,
 * primary = counts and dates). The deep stop is dark enough to carry white text on every tone.
 *
 * It lives in `lib/` rather than beside the dashboard's card because every route's KPI row renders
 * one: the dashboards, reports, attendance, timetable, fees and a student's profile.
 */
export const statGradientStyles: Record<IconTone, string> = {
  primary: 'from-stat-primary-light to-stat-primary-deep',
  success: 'from-stat-success-light to-stat-success-deep',
  warning: 'from-stat-warning-light to-stat-warning-deep',
  error: 'from-stat-error-light to-stat-error-deep',
}

/** The shell every key-metric card shares — the fill, the radius and the resting depth. */
export const statCardShell =
  'rounded-xl bg-linear-to-r p-5 shadow-(--shadow-card) transition duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-hover)'

/** The tone-coloured mark on a filled card: a translucent white chip, never a tinted one. */
export const statMarkStyles = 'bg-white/20 text-white'
