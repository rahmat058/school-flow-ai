import { cn } from '@/lib/cn'
import { useId } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useControllableState } from '@/hooks/useControllableState'

type SwitchSize = 'sm' | 'md'

const trackStyles: Record<SwitchSize, string> = {
  sm: 'h-[18px] w-8',
  md: 'h-[22px] w-10',
}

const knobStyles: Record<SwitchSize, { className: string; off: number; on: number }> = {
  sm: { className: 'size-3.5', off: 2, on: 16 },
  md: { className: 'size-[18px]', off: 2, on: 20 },
}

interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: ReactNode
  description?: string
  disabled?: boolean
  name?: string
  value?: string
  size?: SwitchSize
  id?: string
  className?: string
}

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  disabled,
  name,
  value,
  size = 'md',
  id,
  className,
}: SwitchProps) {
  const generatedId = useId()
  const switchId = id ?? generatedId
  const knob = knobStyles[size]
  const [isChecked, setChecked] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  })

  return (
    <label
      htmlFor={switchId}
      className={cn(
        'flex items-start gap-3',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}>
      <span className="relative mt-px inline-flex shrink-0 items-center">
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          name={name}
          value={value}
          checked={isChecked}
          disabled={disabled}
          onChange={(event) => setChecked(event.target.checked)}
          className="peer sr-only"
        />

        <span
          className={cn(
            'rounded-full transition-colors',
            'peer-focus-visible:ring-primary/12 peer-focus-visible:ring-[3px]',
            trackStyles[size],
            isChecked ? 'bg-primary' : 'bg-line',
          )}
        />

        <motion.span
          initial={false}
          animate={{ x: isChecked ? knob.on : knob.off, y: '-50%' }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={cn('bg-surface absolute top-1/2 rounded-full shadow-sm', knob.className)}
        />
      </span>

      {label || description ? (
        <span className="min-w-0">
          {label ? <span className="text-ink block text-[14px] font-medium">{label}</span> : null}
          {description ? <span className="text-ink-muted mt-0.5 block text-[12px]">{description}</span> : null}
        </span>
      ) : null}
    </label>
  )
}
