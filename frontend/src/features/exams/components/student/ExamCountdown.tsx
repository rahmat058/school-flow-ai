import { cn } from '@/lib/cn'

/**
 * How long until a paper or a window opens. The days come from the read model, so the chip only
 * decides how to say them — `3d left`, `Today`, `12d ago` — and which tone they carry: imminent is
 * the error tint, this week the warning tint, anything further out the primary tint, so a tab reads
 * at a glance without a legend.
 */
export function ExamCountdown({ days }: { days: number }) {
  const label = days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'Today' : `${days}d left`

  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium tabular-nums',
        days <= 0
          ? 'bg-error-soft text-error'
          : days <= 3
            ? 'bg-orange-soft text-warning'
            : 'bg-primary-soft text-primary',
      )}>
      {label}
    </span>
  )
}
