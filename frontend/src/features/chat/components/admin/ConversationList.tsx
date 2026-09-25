import { MessagesSquare, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { ConversationListItem } from '@/types/communication'

interface ConversationListProps {
  items: ConversationListItem[]
  activeId: string | null
  search: string
  onSearchChange: (value: string) => void
  onSelect: (id: string) => void
  loading: boolean
  className?: string
}

export function ConversationList({
  items,
  activeId,
  search,
  onSearchChange,
  onSelect,
  loading,
  className,
}: ConversationListProps) {
  return (
    <div className={cn('border-line flex min-w-0 flex-col', className)}>
      <div className="border-line shrink-0 space-y-3 border-b p-5">
        <div>
          <h1 className="font-display text-ink text-[22px] font-semibold tracking-[-0.03em]">Communication</h1>
          <p className="text-ink-muted mt-1 text-[13px]">Chat with teachers, students and admins.</p>
        </div>

        <Input
          icon={Search}
          type="search"
          placeholder="Search conversations…"
          aria-label="Search conversations"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-1" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-2">
            <EmptyState
              icon={MessagesSquare}
              title="No conversations"
              description="Nothing matches that search yet."
              className="py-8"
            />
          </div>
        ) : (
          <ul>
            {items.map((item) => {
              const active = item.id === activeId

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                      active ? 'bg-primary-soft' : 'hover:bg-primary-soft',
                    )}>
                    {active ? (
                      <span className="bg-primary absolute inset-y-2 left-0 w-1 rounded-full" aria-hidden="true" />
                    ) : null}

                    <Avatar name={item.name} size="md" />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-ink truncate text-[14px] font-medium">{item.name}</span>
                        <span className="text-ink-subtle shrink-0 text-[11px]">
                          {formatDate(item.lastMessageAt, 'HH:mm')}
                        </span>
                      </span>

                      <span className="text-ink-subtle mt-0.5 block truncate text-[11.5px]">
                        {item.participantLabel}
                      </span>

                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="text-ink-muted truncate text-[12.5px]">{item.lastMessage}</span>
                        {item.unreadCount > 0 && !active ? (
                          <span className="bg-primary shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white">
                            {item.unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
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
