import { cn } from '@/lib/cn'
import { statCardShell, statGradientStyles, statMarkStyles } from '@/lib/statTone'
import type { LucideIcon } from 'lucide-react'
import type { IconTone } from '@/types/dashboard'

interface ReportStatProps {
  icon: LucideIcon
  tone: IconTone
  label: string
  value: string
}

/** A report tile: a mark, one figure, one label — filled in its tone, like every key-metric card. */
export function ReportStat({ icon: Icon, tone, label, value }: ReportStatProps) {
  return (
    <article className={cn(statCardShell, statGradientStyles[tone])}>
      <span className={cn('mb-4 inline-flex size-10 items-center justify-center rounded-full', statMarkStyles)}>
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>

      <p className="font-display text-[26px] leading-none font-semibold tracking-[-0.03em] text-white tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-[13px] text-white/80">{label}</p>
    </article>
  )
}
