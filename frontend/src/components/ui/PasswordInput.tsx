import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import type { InputProps } from '@/components/ui/Input'

type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>

/**
 * Password field with a show/hide toggle. The toggle rides in `Input`'s trailing slot, so the field
 * keeps the same sizing, focus ring and error treatment as every other input, and react-hook-form's
 * `register()` still receives the underlying DOM ref.
 */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const ToggleIcon = visible ? EyeOff : Eye

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
          className="text-ink-subtle hover:bg-canvas hover:text-ink inline-flex size-8 items-center justify-center rounded-md transition-colors">
          <ToggleIcon className="size-4" strokeWidth={1.75} />
        </button>
      }
    />
  )
}
