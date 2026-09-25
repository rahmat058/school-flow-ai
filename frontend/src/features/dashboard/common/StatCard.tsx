import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { statCardShell, statGradientStyles, statMarkStyles } from '@/lib/statTone'
import type { StatMetric } from '@/types/dashboard'

interface StatCardProps {
  metric: StatMetric
}

export function StatCard({ metric }: StatCardProps) {
  const Icon = metric.icon
  const hasTrend = metric.direction !== undefined
  const TrendIcon = metric.direction === 'up' ? ArrowUpRight : ArrowDownRight

  return (
    <article className={cn(statCardShell, statGradientStyles[metric.iconTone])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-white/80">{metric.label}</p>
          <p className="font-display mt-2 text-[28px] leading-none font-semibold tracking-[-0.03em] text-white">
            {metric.value}
          </p>
        </div>

        {/* A translucent mark rather than a tinted chip — the fill already carries the tone. */}
        <span className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full', statMarkStyles)}>
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
