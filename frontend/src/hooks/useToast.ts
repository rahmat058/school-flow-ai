import { createContext, useContext } from 'react'
import type { LucideIcon } from 'lucide-react'

export type ToastTone = 'success' | 'warning' | 'error' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** Milliseconds before auto-dismiss. `0` keeps the toast until it is dismissed. */
  duration?: number
  icon?: LucideIcon
}

export interface ToastContextValue {
  /** Shows a toast and returns its id. */
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
