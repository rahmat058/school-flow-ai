import { Fragment, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface DropdownItemConfig {
  id: string
  label: string
  onSelect: () => void
  icon?: LucideIcon
  danger?: boolean
  disabled?: boolean
  separatorBefore?: boolean
}

interface DropdownProps {
  items: DropdownItemConfig[]
  triggerLabel: string
  trigger?: ReactNode
  align?: 'start' | 'end'
  className?: string
}

export function Dropdown({ items, triggerLabel, trigger, align = 'end', className }: DropdownProps) {
  const baseId = useId()
  const menuId = `${baseId}-menu`
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    menuRef.current?.focus()
  }, [open])

  function openMenu() {
    setActiveIndex(items.findIndex((item) => !item.disabled))
    setOpen(true)
  }

  function moveActive(step: number) {
    if (items.length === 0) return

    setActiveIndex((current) => {
      let next = current < 0 ? (step > 0 ? -1 : 0) : current
      for (let index = 0; index < items.length; index++) {
        next = (next + step + items.length) % items.length
        if (!items[next].disabled) return next
      }
      return current
    })
  }

  function lastEnabledIndex() {
    for (let index = items.length - 1; index >= 0; index--) {
      if (!items[index].disabled) return index
    }
    return -1
  }

  function selectItem(index: number) {
    const item = items[index]
    if (!item || item.disabled) return
    setOpen(false)
    triggerRef.current?.focus()
    item.onSelect()
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveActive(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveActive(-1)
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(items.findIndex((item) => !item.disabled))
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(lastEnabledIndex())
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        selectItem(activeIndex)
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={triggerLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openMenu()
          }
        }}
        className="text-ink-muted hover:bg-canvas hover:text-ink inline-flex size-8 items-center justify-center rounded-md transition-colors">
        {trigger ?? <MoreVertical className="size-4" strokeWidth={1.75} />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            tabIndex={-1}
            aria-label={triggerLabel}
            aria-activedescendant={activeIndex >= 0 ? `${baseId}-item-${activeIndex}` : undefined}
            onKeyDown={handleMenuKeyDown}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'border-line bg-surface absolute top-full z-50 mt-1 min-w-[180px] origin-top rounded-lg border p-1 shadow-[var(--shadow-hover)] focus:outline-none',
              align === 'end' ? 'right-0' : 'left-0',
            )}>
            {items.map((item, index) => {
              const Icon = item.icon

              return (
                <Fragment key={item.id}>
                  {item.separatorBefore ? <div role="separator" className="bg-line my-1 h-px" /> : null}

                  <div
                    id={`${baseId}-item-${index}`}
                    role="menuitem"
                    aria-disabled={item.disabled || undefined}
                    onMouseEnter={() => !item.disabled && setActiveIndex(index)}
                    onClick={() => selectItem(index)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                      item.danger ? 'text-error hover:bg-error-soft' : 'text-ink',
                      !item.disabled && index === activeIndex && 'bg-canvas',
                      item.disabled && 'text-ink-subtle pointer-events-none opacity-60',
                    )}>
                    {Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.75} /> : null}
                    <span className="truncate">{item.label}</span>
                  </div>
                </Fragment>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
