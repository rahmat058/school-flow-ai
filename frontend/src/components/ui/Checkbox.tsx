import { useId } from 'react'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useControllableState } from '@/hooks/useControllableState'

interface CheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: ReactNode
  description?: string
  disabled?: boolean
  error?: string
  name?: string
  value?: string
  id?: string
  className?: string
}

export function Checkbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  disabled,
  error,
  name,
  value,
  id,
  className,
}: CheckboxProps) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  const [isChecked, setChecked] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  })

  return (
    <div className={className}>
      <label
        htmlFor={checkboxId}
        className={cn('flex items-start gap-2.5', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
        <span className="relative mt-px flex size-[18px] shrink-0 items-center justify-center">
          <input
            id={checkboxId}
            type="checkbox"
            name={name}
            value={value}
            checked={isChecked}
            disabled={disabled}
            onChange={(event) => setChecked(event.target.checked)}
            className="peer sr-only"
          />

          <span
            className={cn(
              'size-[18px] rounded-sm border transition-colors',
              'peer-focus-visible:ring-primary/12 peer-focus-visible:ring-[3px]',
              isChecked ? 'border-primary bg-primary' : 'border-line bg-surface',
              error && !isChecked && 'border-error',
            )}
          />

          <AnimatePresence>
            {isChecked ? (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-white">
                <Check className="size-3.5" strokeWidth={3} />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>

        {label || description ? (
          <span className="min-w-0">
            {label ? <span className="text-ink block text-[14px] font-medium">{label}</span> : null}
            {description ? <span className="text-ink-muted mt-0.5 block text-[12px]">{description}</span> : null}
          </span>
        ) : null}
      </label>

      {error ? <p className="text-error mt-1.5 text-[12px]">{error}</p> : null}
    </div>
  )
}
