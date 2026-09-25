import { cn } from '@/lib/cn'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

const enterOffset: Record<TooltipSide, { x?: number; y?: number }> = {
  top: { y: 4 },
  bottom: { y: -4 },
  left: { x: 4 },
  right: { x: -4 },
}

interface Placement {
  top: number
  left: number
  /** The centring transform for the side — the bubble's own motion animates a separate element. */
  transform: string
}

/** Where the bubble sits, in viewport coordinates, given its trigger's box. */
function place(side: TooltipSide, rect: DOMRect): Placement {
  const gap = 8

  switch (side) {
    case 'bottom':
      return { top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: 'translate(-100%, -50%)' }
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.right + gap, transform: 'translateY(-50%)' }
    default:
      return { top: rect.top - gap, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }
  }
}

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: TooltipSide
  delay?: number
  className?: string
  /** Suppresses the tooltip — used for a nav rail that is only icon-only while collapsed. */
  disabled?: boolean
}

/**
 * A hover/focus label. The bubble is **portalled to the body** and positioned from the trigger's
 * rect, because an absolutely-positioned one is clipped by any scrolling ancestor — the sidebar's
 * nav scrolls, so every label inside it was cut off at the rail's edge.
 */
export function Tooltip({ content, children, side = 'top', delay = 150, disabled = false, className }: TooltipProps) {
  const tooltipId = useId()
  const anchorRef = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<number | null>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const [open, setOpen] = useState(false)

  function show() {
    if (disabled) return

    timeoutRef.current = window.setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return

      setPlacement(place(side, rect))
      setOpen(true)
    }, delay)
  }

  function hide() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setOpen(false)
  }

  return (
    <span
      ref={anchorRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open ? tooltipId : undefined}>
      {children}

      {/* Kept mounted once placed, so the exit motion runs; it holds nothing while closed. */}
      {placement && typeof document !== 'undefined'
        ? createPortal(
            <span
              style={{ position: 'fixed', top: placement.top, left: placement.left, transform: placement.transform }}
              className="pointer-events-none z-100 block">
              <AnimatePresence>
                {open ? (
                  <motion.span
                    id={tooltipId}
                    role="tooltip"
                    initial={{ opacity: 0, ...enterOffset[side] }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, ...enterOffset[side] }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="bg-ink text-surface block w-max max-w-55 rounded-md px-2.5 py-1.5 text-[12px] shadow-(--shadow-hover)">
                    {content}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
