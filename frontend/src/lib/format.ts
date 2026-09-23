import { format, parseISO } from 'date-fns'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Amounts are stored as integer minor units (×100) — format at the edge only.
 * Displayed in USD; see `docs/frontend/Memory.md` for the storage-unit caveat.
 */
export function formatPaise(paise: number): string {
  return currencyFormatter.format(paise / 100)
}

/** Compact form for charts and stat values: $4.5M, $120k. */
export function formatPaiseCompact(paise: number): string {
  const value = paise / 100
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${value.toFixed(0)}`
}

export function formatDate(value: string | null, pattern = 'dd MMM yyyy'): string {
  if (!value) return '—'
  return format(parseISO(value), pattern)
}

export function formatDateTime(value: string | null): string {
  return formatDate(value, 'dd MMM yyyy, HH:mm')
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** `PENDING` → `Pending`, for enum values shown in tables and badges. */
export function humanizeEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
