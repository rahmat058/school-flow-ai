import { useCallback, useState } from 'react'

interface ControllableStateOptions<T> {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}

export function useControllableState<T>({ value, defaultValue, onChange }: ControllableStateOptions<T>) {
  const [internalValue, setInternalValue] = useState<T>(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setInternalValue(next)
      }
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return [currentValue, setValue] as const
}
