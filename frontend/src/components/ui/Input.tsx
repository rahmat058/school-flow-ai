import { cn } from '@/lib/cn'
import { useId } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ComponentPropsWithRef, ReactNode } from 'react'

/** `ComponentPropsWithRef` (not `InputHTMLAttributes`) so react-hook-form's `register()` ref flows through. */
export interface InputProps extends ComponentPropsWithRef<'input'> {
  label?: string
  hint?: string
  error?: string
  icon?: LucideIcon
  /** Rendered at the trailing edge of the field — e.g. a password visibility toggle. */
  trailing?: ReactNode
}

export function Input({ label, hint, error, icon: Icon, trailing, id, className, disabled, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const hasMessage = Boolean(error || hint)

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="text-ink mb-1.5 block text-[13px] font-medium">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {Icon ? (
          <Icon
            className="text-ink-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            strokeWidth={1.75}
          />
        ) : null}

        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            'border-line bg-surface text-ink placeholder:text-ink-subtle h-[42px] w-full rounded-md border px-3.5 text-[14px] transition-colors focus:outline-none',
            'focus:border-primary focus:ring-primary/12 focus:ring-[3px]',
            'disabled:bg-canvas disabled:text-ink-subtle disabled:cursor-not-allowed',
            Icon && 'pl-10',
            trailing && 'pr-11',
            error && 'border-error focus:border-error focus:ring-error/12',
            className,
          )}
          {...props}
        />

        {trailing ? <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</span> : null}
      </div>

      {error ? (
        <p id={messageId} className="text-error mt-1.5 text-[12px]">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-ink-subtle mt-1.5 text-[12px]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
