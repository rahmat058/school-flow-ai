import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { iconToneStyles } from '@/components/dashboard/common/iconTone'
import type { StatMetric } from '@/types/dashboard'

interface StatCardProps {
  metric: StatMetric
}

export function StatCard({ metric }: StatCardProps) {
  const Icon = metric.icon
  const hasTrend = metric.direction !== undefined
  const isPositive = metric.direction === 'up'
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <div
        className={cn(
          'mb-4 inline-flex size-10 items-center justify-center rounded-lg',
          iconToneStyles[metric.iconTone],
        )}>
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </div>
      <p className="text-ink-muted text-[13px]">{metric.label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-display text-ink text-[28px] leading-none font-semibold tracking-[-0.03em]">
          {metric.value}
        </p>
        {hasTrend ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[13px] font-medium',
              isPositive ? 'text-success' : 'text-error',
            )}>
            <TrendIcon className="size-3.5" strokeWidth={2} />
            {metric.delta}
          </span>
        ) : (
          // No better-or-worse reading — the caption stays ink while the icon chip carries the tone.
          <span className="text-ink-muted text-[13px]">{metric.delta}</span>
        )}
      </div>
    </article>
  )
}
