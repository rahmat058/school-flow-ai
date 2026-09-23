import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'
import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

const sideStyles: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

const enterOffset: Record<TooltipSide, { x?: number; y?: number }> = {
  top: { y: 4 },
  bottom: { y: -4 },
  left: { x: 4 },
  right: { x: -4 },
}

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: TooltipSide
  delay?: number
  className?: string
}

export function Tooltip({ content, children, side = 'top', delay = 150, className }: TooltipProps) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  function show() {
    timeoutRef.current = window.setTimeout(() => setOpen(true), delay)
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
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open ? tooltipId : undefined}>
      {children}

      <AnimatePresence>
        {open ? (
          <span className={cn('pointer-events-none absolute z-50', sideStyles[side])}>
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
          </span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
