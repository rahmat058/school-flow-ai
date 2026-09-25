import { cn } from '@/lib/cn'
import { iconToneStyles } from '@/features/dashboard/common/iconTone'
import type { LucideIcon } from 'lucide-react'
import type { IconTone } from '@/types/dashboard'

interface ReportStatProps {
  icon: LucideIcon
  tone: IconTone
  label: string
  value: string
}

/** A report tile: an icon chip, one figure, one label. Unlike the dashboard's it carries no delta. */
export function ReportStat({ icon: Icon, tone, label, value }: ReportStatProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card)">
      <div className={cn('mb-4 inline-flex size-10 items-center justify-center rounded-lg', iconToneStyles[tone])}>
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </div>
      <p className="font-display text-ink text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
        {value}
      </p>
      <p className="text-ink-muted mt-2 text-[13px]">{label}</p>
    </article>
  )
}
