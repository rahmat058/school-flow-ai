import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type SpinnerSize = 'sm' | 'md' | 'lg'

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

interface SpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn('text-primary inline-flex', className)}>
      <Loader2 className={cn('animate-spin', sizeStyles[size])} strokeWidth={2} />
    </span>
  )
}
