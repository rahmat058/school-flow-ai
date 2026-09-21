import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover hover:shadow-[var(--shadow-primary)]',
  secondary: 'bg-transparent text-ink border border-line hover:bg-canvas',
  ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-canvas',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-[38px] px-4 text-[14px]',
  lg: 'h-11 px-6 text-[15px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}>
      {children}
    </button>
  )
}
