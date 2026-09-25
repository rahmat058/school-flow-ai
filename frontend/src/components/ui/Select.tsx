import { cn } from '@/lib/cn'
import type { KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = 'Select…',
  label,
  error,
  disabled,
  className,
  id,
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    document.getElementById(`${selectId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open, selectId])

  function openListbox() {
    if (disabled) return
    const selectedIndex = options.findIndex((option) => option.value === value)
    const fallbackIndex = options.findIndex((option) => !option.disabled)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : fallbackIndex)
    setOpen(true)
  }

  function selectOption(index: number) {
    const option = options[index]
    if (!option || option.disabled) return
    onValueChange(option.value)
    setOpen(false)
  }

  function moveActive(step: number) {
    if (options.length === 0) return

    setActiveIndex((current) => {
      let next = current < 0 ? (step > 0 ? -1 : 0) : current
      for (let index = 0; index < options.length; index++) {
        next = (next + step + options.length) % options.length
        if (!options[next].disabled) return next
      }
      return current
    })
  }

  function lastEnabledIndex() {
    for (let index = options.length - 1; index >= 0; index--) {
      if (!options[index].disabled) return index
    }
    return -1
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openListbox()
      }
      return
    }

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
        setActiveIndex(options.findIndex((option) => !option.disabled))
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(lastEnabledIndex())
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        selectOption(activeIndex)
        break
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label ? (
        <label htmlFor={selectId} className="text-ink mb-1.5 block text-[13px] font-medium">
          {label}
        </label>
      ) : null}

      <button
        type="button"
        id={selectId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openListbox())}
        onKeyDown={handleKeyDown}
        className={cn(
          'border-line bg-surface text-ink flex h-10.5 w-full items-center justify-between gap-2 rounded-md border px-3.5 text-left text-[14px] transition-colors',
          'focus:border-primary focus:ring-primary/12 focus:ring-[3px] focus:outline-none',
          'disabled:bg-canvas disabled:text-ink-subtle disabled:cursor-not-allowed',
          error && 'border-error focus:border-error focus:ring-error/12',
        )}>
        <span className={cn('truncate', selectedOption ? 'text-ink' : 'text-ink-subtle')}>
          {selectedOption?.label ?? placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="text-ink-subtle shrink-0">
          <ChevronDown className="size-4" strokeWidth={1.75} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="border-line bg-surface absolute z-50 mt-1 max-h-60 w-full origin-top overflow-y-auto rounded-lg border p-1 shadow-(--shadow-hover)">
            {options.map((option, index) => {
              const isSelected = option.value === value

              return (
                <li
                  key={option.value}
                  id={`${selectId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(index)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[14px] transition-colors',
                    !option.disabled && index === activeIndex && 'bg-primary-soft text-primary',
                    option.disabled && 'text-ink-subtle cursor-not-allowed',
                    isSelected && !option.disabled && 'text-primary font-medium',
                  )}>
                  <span className="truncate">{option.label}</span>
                  {isSelected ? <Check className="text-primary size-4 shrink-0" strokeWidth={2} /> : null}
                </li>
              )
            })}
            {options.length === 0 ? <li className="text-ink-subtle px-2.5 py-2 text-[13px]">No options</li> : null}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      {error ? <p className="text-error mt-1.5 text-[12px]">{error}</p> : null}
    </div>
  )
}
