import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { IconTone, StatMetric } from '@/types/dashboard'

/**
 * The fill per metric tone — a light-to-deep gradient, because a stat card's colour **is** its
 * meaning (success = healthy, error = needs attention, warning = due soon, primary = counts and
 * dates). The deep end is dark enough for white text on every tone.
 */
const gradientToneStyles: Record<IconTone, string> = {
  primary: 'from-stat-primary-light to-stat-primary-deep',
  success: 'from-stat-success-light to-stat-success-deep',
  warning: 'from-stat-warning-light to-stat-warning-deep',
  error: 'from-stat-error-light to-stat-error-deep',
}

interface StatCardProps {
  metric: StatMetric
}

export function StatCard({ metric }: StatCardProps) {
  const Icon = metric.icon
  const hasTrend = metric.direction !== undefined
  const TrendIcon = metric.direction === 'up' ? ArrowUpRight : ArrowDownRight

  return (
    <article
      className={cn(
        'rounded-xl bg-linear-to-r p-5 shadow-(--shadow-card) transition duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-hover)',
        gradientToneStyles[metric.iconTone],
      )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-white/80">{metric.label}</p>
          <p className="font-display mt-2 text-[28px] leading-none font-semibold tracking-[-0.03em] text-white">
            {metric.value}
          </p>
        </div>

        {/* A translucent mark rather than a tinted chip — the fill already carries the tone. */}
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
          <Icon className="size-[18px]" strokeWidth={1.75} />
        </span>
      </div>

      {hasTrend ? (
        // The arrow says the direction; the tone belongs to the card, so the text stays white.
        <span className="mt-3 inline-flex items-center gap-0.5 text-[13px] font-medium text-white">
          <TrendIcon className="size-3.5" strokeWidth={2} />
          {metric.delta}
        </span>
      ) : (
        <p className="mt-3 text-[13px] text-white/80">{metric.delta}</p>
      )}
    </article>
  )
}
