import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ToastContext } from '@/hooks/useToast'
import { AnimatePresence, motion } from 'motion/react'
import type { ToastOptions, ToastTone } from '@/hooks/useToast'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

interface ToastToneStyle {
  container: string
  icon: string
  defaultIcon: LucideIcon
}

const toneStyles: Record<ToastTone, ToastToneStyle> = {
  success: { container: 'border-success/20 bg-success-soft', icon: 'text-success', defaultIcon: CheckCircle2 },
  warning: { container: 'border-warning/20 bg-warning-soft', icon: 'text-warning', defaultIcon: AlertTriangle },
  error: { container: 'border-error/20 bg-error-soft', icon: 'text-error', defaultIcon: AlertCircle },
  info: { container: 'border-primary/20 bg-primary-soft', icon: 'text-primary', defaultIcon: Info },
}

/** Errors stay longer than confirmations — a failure needs time to be read. */
const toneDuration: Record<ToastTone, number> = {
  success: 5000,
  info: 5000,
  warning: 6000,
  error: 8000,
}

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
  onDismiss?: () => void
}

export function Toast({ title, description, tone = 'info', icon, onDismiss }: ToastProps) {
  const { container, icon: iconColor, defaultIcon } = toneStyles[tone]
  const Icon = icon ?? defaultIcon

  return (
    <div
      className={cn('pointer-events-auto flex w-full gap-3 rounded-lg border p-4 shadow-(--shadow-hover)', container)}>
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
    </div>
  )
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, number>())
  const nextId = useRef(0)

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const startTimer = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return
      clearTimer(id)
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id)
          setToasts((current) => current.filter((item) => item.id !== id))
        }, duration),
      )
    },
    [clearTimer],
  )

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id)
      setToasts((current) => current.filter((item) => item.id !== id))
    },
    [clearTimer],
  )

  const dismissAll = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current.clear()
    setToasts([])
  }, [])

  const toast = useCallback(
    ({ title, description, tone = 'info', duration, icon }: ToastOptions) => {
      const id = String(++nextId.current)
      const resolvedDuration = duration ?? toneDuration[tone]

      setToasts((current) => [...current, { id, title, description, tone, duration: resolvedDuration, icon }])
      startTimer(id, resolvedDuration)

      return id
    },
    [startTimer],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast, dismiss, dismissAll }), [toast, dismiss, dismissAll])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-60 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm">
        <AnimatePresence initial={false}>
          {toasts.map((record) => (
            <motion.div
              key={record.id}
              layout
              role={record.tone === 'error' || record.tone === 'warning' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              onMouseEnter={() => clearTimer(record.id)}
              onMouseLeave={() => startTimer(record.id, record.duration)}>
              <Toast
                title={record.title}
                description={record.description}
                tone={record.tone}
                icon={record.icon}
                onDismiss={() => dismiss(record.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
