import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'

type SortDirection = 'asc' | 'desc'

export interface DataTableColumn<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Array<DataTableColumn<T>>
  getRowId: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: LucideIcon
  pageSize?: number
  onRowClick?: (row: T) => void
  className?: string
}

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export function DataTable<T>({
  data,
  columns,
  getRowId,
  loading = false,
  skeletonRows = 5,
  emptyTitle = 'Nothing to show',
  emptyDescription,
  emptyIcon,
  pageSize = 10,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ id: string; direction: SortDirection } | null>(null)
  const [page, setPage] = useState(1)

  const sortedData = useMemo(() => {
    if (!sort) return data

    const sortValue = columns.find((column) => column.id === sort.id)?.sortValue
    if (!sortValue) return data

    const factor = sort.direction === 'asc' ? 1 : -1

    return [...data].sort((left, right) => {
      const leftValue = sortValue(left)
      const rightValue = sortValue(right)

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * factor
      }

      return String(leftValue).localeCompare(String(rightValue)) * factor
    })
  }, [columns, data, sort])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const rangeStart = (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, sortedData.length)

  const pageRows = useMemo(
    () => sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, sortedData],
  )

  function toggleSort(columnId: string) {
    setPage(1)
    setSort((current) => {
      if (!current || current.id !== columnId) return { id: columnId, direction: 'asc' }
      if (current.direction === 'asc') return { id: columnId, direction: 'desc' }
      return null
    })
  }

  if (!loading && data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} className={className} />
  }

  return (
    <div className={cn('border-line bg-surface overflow-hidden rounded-xl border', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => {
              const isSorted = sort?.id === column.id
              const SortIcon = !isSorted ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown

              return (
                <TableHead key={column.id} className={cn(alignStyles[column.align ?? 'left'], column.className)}>
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.id)}
                      className={cn(
                        'hover:text-ink inline-flex items-center gap-1.5 transition-colors',
                        isSorted && 'text-ink',
                      )}>
                      {column.header}
                      <SortIcon className="size-3.5" strokeWidth={1.75} />
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell key={column.id} className={cn(alignStyles[column.align ?? 'left'], column.className)}>
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : pageRows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={cn(alignStyles[column.align ?? 'left'], column.className)}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {!loading && pageCount > 1 ? (
        <div className="border-line flex items-center justify-between gap-4 border-t px-4 py-3">
          <p className="text-ink-subtle text-[12px]">
            Showing {rangeStart}–{rangeEnd} of {sortedData.length}
          </p>
          <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  )
}
