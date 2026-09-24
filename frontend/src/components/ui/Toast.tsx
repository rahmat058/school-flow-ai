import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ToastContext } from '@/hooks/useToast'
import type { MotionValue } from 'motion/react'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import type { ToastOptions, ToastTone } from '@/hooks/useToast'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

interface ToastToneStyle {
  container: string
  icon: string
  bar: string
  defaultIcon: LucideIcon
}

const toneStyles: Record<ToastTone, ToastToneStyle> = {
  success: {
    container: 'border-success/20 bg-success-soft',
    icon: 'text-success',
    bar: 'bg-success',
    defaultIcon: CheckCircle2,
  },
  warning: {
    container: 'border-warning/20 bg-warning-soft',
    icon: 'text-warning',
    bar: 'bg-warning',
    defaultIcon: AlertTriangle,
  },
  error: {
    container: 'border-error/20 bg-error-soft',
    icon: 'text-error',
    bar: 'bg-error',
    defaultIcon: AlertCircle,
  },
  info: {
    container: 'border-primary/20 bg-primary-soft',
    icon: 'text-primary',
    bar: 'bg-primary',
    defaultIcon: Info,
  },
}

/** Errors stay longer than confirmations — a failure needs time to be read. */
const toneDuration: Record<ToastTone, number> = {
  success: 5000,
  info: 5000,
  warning: 6000,
  error: 8000,
}

const BOUNCE_FROM = 448
const DISMISS_DRAG = 120

interface ToastRecord {
  id: string
  title: string
  description?: string
  tone: ToastTone
  duration: number
  icon?: LucideIcon
}

interface ToastProps {
  title: string
  description?: string
  tone?: ToastTone
  icon?: LucideIcon
  progress?: MotionValue<number>
  onDismiss?: () => void
}

export function Toast({ title, description, tone = 'info', icon, progress, onDismiss }: ToastProps) {
  const { container, icon: iconColor, bar, defaultIcon } = toneStyles[tone]
  const Icon = icon ?? defaultIcon

  return (
    <div
      className={cn(
        'relative flex w-full gap-3 overflow-hidden rounded-lg border p-4 shadow-(--shadow-hover)',
        container,
      )}>
      <Icon className={cn('mt-px size-4.5 shrink-0', iconColor)} strokeWidth={1.75} />

      <div className="min-w-0 flex-1">
        <p className="text-ink text-[14px] font-medium">{title}</p>
        {description ? <p className="text-ink-muted mt-1 text-[13px]">{description}</p> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-ink-subtle hover:text-primary -mt-1 -mr-1 shrink-0 rounded-md p-1 transition-colors">
          <X className="size-4" strokeWidth={2} />
        </button>
      ) : null}

      {progress ? (
        <motion.div
          aria-hidden="true"
          style={{ scaleX: progress }}
          className={cn('absolute inset-x-0 bottom-0 h-1 origin-left', bar)}
        />
      ) : null}
    </div>
  )
}

interface ToastItemProps {
  record: ToastRecord
  onDismiss: (id: string) => void
}

function ToastItem({ record, onDismiss }: ToastItemProps) {
  const progress = useMotionValue(1)
  const controls = useRef<ReturnType<typeof animate> | null>(null)

  useEffect(() => {
    if (record.duration <= 0) return

    const playback = animate(progress, 0, {
      duration: record.duration / 1000,
      ease: 'linear',
      onComplete: () => onDismiss(record.id),
    })
    controls.current = playback

    return () => {
      playback.stop()
      controls.current = null
    }
  }, [progress, record.duration, record.id, onDismiss])

  return (
    <motion.div
      layout
      role={record.tone === 'error' || record.tone === 'warning' ? 'alert' : 'status'}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      exit={{
        opacity: [1, 1, 0],
        x: [0, -20, BOUNCE_FROM],
        transition: { duration: 0.45, times: [0, 0.2, 1], ease: 'easeIn' },
      }}
      className="pointer-events-auto"
      onMouseEnter={() => controls.current?.pause()}
      onMouseLeave={() => controls.current?.play()}>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0.2 }}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > DISMISS_DRAG) onDismiss(record.id)
        }}
        initial={{ opacity: 0, x: BOUNCE_FROM }}
        animate={{ opacity: [0, 1, 1, 1, 1], x: [BOUNCE_FROM, -25, 10, -5, 0] }}
        transition={{ duration: 0.75, times: [0, 0.6, 0.75, 0.9, 1], ease: [0.215, 0.61, 0.355, 1] }}>
        <Toast
          title={record.title}
          description={record.description}
          tone={record.tone}
          icon={record.icon}
          progress={record.duration > 0 ? progress : undefined}
          onDismiss={() => onDismiss(record.id)}
        />
      </motion.div>
    </motion.div>
  )
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const dismissAll = useCallback(() => setToasts([]), [])

  const toast = useCallback(({ title, description, tone = 'info', duration, icon }: ToastOptions) => {
    const id = String(++nextId.current)
    const resolvedDuration = duration ?? toneDuration[tone]

    setToasts((current) => [...current, { id, title, description, tone, duration: resolvedDuration, icon }])

    return id
  }, [])

  const value = useMemo(() => ({ toast, dismiss, dismissAll }), [toast, dismiss, dismissAll])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 top-4 z-60 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm">
        <AnimatePresence initial={false}>
          {toasts.map((record) => (
            <ToastItem key={record.id} record={record} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
