import { cn } from '@/lib/cn'
import { useId } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const navButtonStyles =
  'text-ink-muted hover:bg-primary-soft hover:text-ink inline-flex size-8 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-40'

interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  siblingCount?: number
  className?: string
}

function buildPageItems(page: number, pageCount: number, siblingCount: number) {
  const items: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, page - siblingCount)
  const end = Math.min(pageCount - 1, page + siblingCount)

  if (start > 2) items.push('ellipsis')
  for (let index = start; index <= end; index++) items.push(index)
  if (end < pageCount - 1) items.push('ellipsis')
  if (pageCount > 1) items.push(pageCount)

  return items
}

export function Pagination({ page, pageCount, onPageChange, siblingCount = 1, className }: PaginationProps) {
  const instanceId = useId()

  if (pageCount <= 1) return null

  const pageItems = buildPageItems(page, pageCount, siblingCount)

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={navButtonStyles}>
        <ChevronLeft className="size-4" strokeWidth={1.75} />
      </button>

      {pageItems.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="text-ink-subtle px-1.5 text-[13px]" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'relative size-8 rounded-md text-[13px] font-medium transition-colors',
              item === page ? 'text-primary' : 'text-ink-muted hover:bg-primary-soft hover:text-ink',
            )}>
            {item === page ? (
              <motion.span
                layoutId={`${instanceId}-page-indicator`}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="bg-primary-soft absolute inset-0 rounded-md"
              />
            ) : null}
            <span className="relative">{item}</span>
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className={navButtonStyles}>
        <ChevronRight className="size-4" strokeWidth={1.75} />
      </button>
    </nav>
  )
}
