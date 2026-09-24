import { ChevronRight, ShieldCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { StaffPermissionRow } from '@/types/permission'

interface StaffListProps {
  rows: StaffPermissionRow[]
  activeId: string | null
  onSelect: (userId: string) => void
  loading: boolean
  className?: string
}

export function StaffList({ rows, activeId, onSelect, loading, className }: StaffListProps) {
  return (
    <div className={cn('border-line flex min-w-0 flex-col', className)}>
      <div className="border-line shrink-0 border-b p-5">
        <h1 className="font-display text-ink text-[22px] font-semibold tracking-[-0.03em]">Roles &amp; permissions</h1>
        <p className="text-ink-muted mt-1 text-[13px]">Assign permissions to teachers.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-1" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-2">
            <EmptyState
              icon={ShieldCheck}
              title="No staff yet"
              description="Add teachers before assigning permissions."
              className="py-8"
            />
          </div>
        ) : (
          <ul>
            {rows.map((row) => {
              const active = row.userId === activeId

              return (
                <li key={row.userId}>
                  <button
                    type="button"
                    onClick={() => onSelect(row.userId)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                      active ? 'bg-primary-soft' : 'hover:bg-primary-soft',
                    )}>
                    {active ? (
                      <span className="bg-primary absolute inset-y-2 left-0 w-1 rounded-full" aria-hidden="true" />
                    ) : null}

                    <Avatar name={row.name} size="md" />

                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate text-[14px] font-medium">{row.name}</span>
                      <span className="text-ink-subtle mt-0.5 block truncate font-mono text-[11.5px]">
                        {row.employeeNo}
                      </span>
                    </span>

                    <ChevronRight
                      className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-ink-subtle')}
                      strokeWidth={1.75}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
