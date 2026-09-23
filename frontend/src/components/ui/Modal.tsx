import { cn } from '@/lib/cn'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { AnimatePresence, motion } from 'motion/react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'

type ModalSize = 'sm' | 'md' | 'lg'

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: ModalSize
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer, className }: ModalProps) {
  const generatedId = useId()
  const titleId = `${generatedId}-title`
  const descriptionId = `${generatedId}-description`
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return

    const container = panelRef.current
    if (!container) return

    const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-ink/40 absolute inset-0 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="relative flex min-h-full items-center justify-center p-4" onKeyDown={handleKeyDown}>
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'border-line bg-surface relative w-full rounded-xl border shadow-[var(--shadow-hover)] outline-none',
                sizeStyles[size],
                className,
              )}>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="text-ink-subtle hover:bg-primary-soft hover:text-primary absolute top-4 right-4 rounded-md p-1.5 transition-colors">
                <X className="size-4" strokeWidth={2} />
              </button>

              <div className="px-5 pt-5 pb-4">
                <h2 id={titleId} className="font-display text-ink pr-8 text-[18px] font-semibold">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="text-ink-muted mt-1 text-[13px]">
                    {description}
                  </p>
                ) : null}
              </div>

              {children ? <div className="px-5 pb-5">{children}</div> : null}

              {footer ? (
                <div className="border-line flex items-center justify-end gap-2 border-t px-5 py-4">{footer}</div>
              ) : null}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'destructive' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size="sm" className="text-white" label="Working" /> : null}
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
