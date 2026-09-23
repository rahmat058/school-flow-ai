import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'border-line bg-surface flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center',
        className,
      )}>
      <span className="bg-canvas text-ink-subtle mb-4 inline-flex size-12 items-center justify-center rounded-full">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>

      <p className="font-display text-ink text-[16px] font-semibold">{title}</p>

      {description ? <p className="text-ink-muted mt-1 max-w-sm text-[13px]">{description}</p> : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  )
}
