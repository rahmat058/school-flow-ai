import { cn } from '@/lib/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('bg-line animate-pulse rounded-md', className)} />
}
