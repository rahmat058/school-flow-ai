import { cn } from '@/lib/cn'
import { motion } from 'motion/react'

type ProgressTone = 'primary' | 'success' | 'warning' | 'error'

const toneStyles: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

interface ProgressProps {
  value: number
  max?: number
  label?: string
  tone?: ProgressTone
  showValue?: boolean
  className?: string
}

export function Progress({ value, max = 100, label, tone = 'primary', showValue = false, className }: ProgressProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div className={className}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {label ? <span className="text-ink text-[13px] font-medium">{label}</span> : null}
          {showValue ? <span className="text-ink-subtle text-[12px]">{Math.round(percentage)}%</span> : null}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="bg-line h-2 w-full overflow-hidden rounded-full">
        <motion.div
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={cn('h-full rounded-full', toneStyles[tone])}
        />
      </div>
    </div>
  )
}
