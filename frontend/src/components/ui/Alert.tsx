import { cn } from '@/lib/cn'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

type AlertTone = 'info' | 'success' | 'warning' | 'error'

const toneStyles: Record<AlertTone, { container: string; icon: string; defaultIcon: LucideIcon }> = {
  info: { container: 'border-primary/20 bg-primary-soft', icon: 'text-primary', defaultIcon: Info },
  success: { container: 'border-success/20 bg-success-soft', icon: 'text-success', defaultIcon: CheckCircle2 },
  warning: { container: 'border-warning/20 bg-warning-soft', icon: 'text-warning', defaultIcon: AlertTriangle },
  error: { container: 'border-error/20 bg-error-soft', icon: 'text-error', defaultIcon: AlertCircle },
}

interface AlertProps {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  icon?: LucideIcon
  onDismiss?: () => void
  className?: string
}

export function Alert({ tone = 'info', title, children, icon, onDismiss, className }: AlertProps) {
  const { container, icon: iconColor, defaultIcon: DefaultIcon } = toneStyles[tone]
  const Icon = icon ?? DefaultIcon

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('flex gap-3 rounded-lg border p-4', container, className)}>
      <Icon className={cn('mt-px size-[18px] shrink-0', iconColor)} strokeWidth={1.75} />

      <div className="min-w-0 flex-1">
        {title ? <p className="text-ink text-[14px] font-medium">{title}</p> : null}
        {children ? <div className={cn('text-ink-muted text-[13px]', title && 'mt-1')}>{children}</div> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-ink-subtle hover:text-primary -mt-1 -mr-1 shrink-0 rounded-md p-1 transition-colors">
          <X className="size-4" strokeWidth={2} />
        </button>
      ) : null}
    </motion.div>
  )
}
