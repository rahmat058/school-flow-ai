import { useId } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { useControllableState } from '@/hooks/useControllableState'

export interface RadioOption {
  value: string
  label: ReactNode
  description?: string
  disabled?: boolean
}

interface RadioGroupProps {
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  label?: string
  error?: string
  name?: string
  orientation?: 'vertical' | 'horizontal'
  disabled?: boolean
  className?: string
}

export function RadioGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  error,
  name,
  orientation = 'vertical',
  disabled,
  className,
}: RadioGroupProps) {
  const generatedId = useId()
  const groupName = name ?? generatedId
  const [selected, setSelected] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: onValueChange,
  })

  return (
    <fieldset className={cn('border-0 p-0', className)} disabled={disabled}>
      {label ? <legend className="text-ink mb-2 text-[13px] font-medium">{label}</legend> : null}

      <div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-wrap items-center')}>
        {options.map((option) => {
          const optionId = `${groupName}-${option.value}`
          const isSelected = selected === option.value
          const isDisabled = disabled || option.disabled

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'flex items-start gap-2.5',
                isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              )}>
              <span className="relative mt-px flex size-[18px] shrink-0 items-center justify-center">
                <input
                  id={optionId}
                  type="radio"
                  name={groupName}
                  value={option.value}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => setSelected(option.value)}
                  className="peer sr-only"
                />

                <span
                  className={cn(
                    'size-[18px] rounded-full border transition-colors',
                    'peer-focus-visible:ring-primary/12 peer-focus-visible:ring-[3px]',
                    isSelected ? 'border-primary bg-surface' : 'border-line bg-surface',
                    error && !isSelected && 'border-error',
                  )}
                />

                <AnimatePresence>
                  {isSelected ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="bg-primary absolute size-2 rounded-full"
                    />
                  ) : null}
                </AnimatePresence>
              </span>

              {option.label || option.description ? (
                <span className="min-w-0">
                  <span className="text-ink block text-[14px] font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="text-ink-muted mt-0.5 block text-[12px]">{option.description}</span>
                  ) : null}
                </span>
              ) : null}
            </label>
          )
        })}
      </div>

      {error ? <p className="text-error mt-2 text-[12px]">{error}</p> : null}
    </fieldset>
  )
}
