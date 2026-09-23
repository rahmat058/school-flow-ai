import { cn } from '@/lib/cn'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Side panel: the same behaviour as `Modal` (portal, Escape, focus trap, scroll lock, focus
 * restored) but it slides in from the right and holds taller forms without a scrolling page behind.
 */
export function Sheet({ open, onClose, title, description, children, footer, className }: SheetProps) {
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
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-ink/40 absolute inset-0 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className={cn(
              'border-line bg-surface absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l shadow-[var(--shadow-hover)] outline-none',
              className,
            )}>
            <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="text-ink-muted mt-1 text-[13px]">
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="text-ink-subtle hover:bg-primary-soft hover:text-primary -mt-1 -mr-1 shrink-0 rounded-md p-1.5 transition-colors">
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>

            {footer ? (
              <div className="border-line flex items-center justify-end gap-2 border-t px-5 py-4">{footer}</div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
