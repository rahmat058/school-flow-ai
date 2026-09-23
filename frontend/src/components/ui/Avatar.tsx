import { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

type AvatarSize = 'sm' | 'md' | 'lg'

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'size-8 text-[12px]',
  md: 'size-9 text-[13px]',
  lg: 'size-12 text-[15px]',
}

const statusStyles = {
  online: 'bg-success',
  offline: 'bg-ink-subtle',
} as const

interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  status?: 'online' | 'offline'
  className?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ name, src, size = 'md', status, className }: AvatarProps) {
  const [hasFailed, setHasFailed] = useState(false)
  const showImage = Boolean(src) && !hasFailed

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'bg-primary-soft text-primary inline-flex items-center justify-center overflow-hidden rounded-full font-medium',
          sizeStyles[size],
        )}>
        {showImage ? (
          <motion.img
            src={src}
            alt={name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onError={() => setHasFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <>
            <span aria-hidden="true">{getInitials(name)}</span>
            <span className="sr-only">{name}</span>
          </>
        )}
      </span>

      {status ? (
        <span
          aria-hidden="true"
          className={cn(
            'border-surface absolute right-0 bottom-0 size-2.5 rounded-full border-2',
            statusStyles[status],
          )}
        />
      ) : null}
    </span>
  )
}
