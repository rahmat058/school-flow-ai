import { cn } from '@/lib/cn'
import { useId } from 'react'
import type { ComponentPropsWithRef } from 'react'

/** `ComponentPropsWithRef` (not `TextareaHTMLAttributes`) so react-hook-form's `register()` ref flows through. */
interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, id, className, rows = 4, ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const messageId = `${textareaId}-message`
  const hasMessage = Boolean(error || hint)

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textareaId} className="text-ink mb-1.5 block text-[13px] font-medium">
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={cn(
          'border-line bg-surface text-ink placeholder:text-ink-subtle w-full resize-y rounded-md border px-3.5 py-2.5 text-[14px] leading-relaxed transition-colors focus:outline-none',
          'focus:border-primary focus:ring-primary/12 focus:ring-[3px]',
          'disabled:bg-canvas disabled:text-ink-subtle disabled:cursor-not-allowed',
          error && 'border-error focus:border-error focus:ring-error/12',
          className,
        )}
        {...props}
      />

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
