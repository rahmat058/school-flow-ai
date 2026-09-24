import { ArrowLeft, MessagesSquare } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useConversationMessages } from '@/features/chat/api'
import { MessageBubble } from '@/features/chat/components/MessageBubble'
import { MessageComposer } from '@/features/chat/components/MessageComposer'
import type { ConversationListItem } from '@/types/communication'

interface ChatWindowProps {
  conversation: ConversationListItem | null
  onBack: () => void
  className?: string
}

export function ChatWindow({ conversation, onBack, className }: ChatWindowProps) {
  const thread = useConversationMessages(conversation?.id ?? null)
  const rows = thread.data ?? []

  if (!conversation) {
    return (
      <div className={cn('flex min-w-0 flex-1 items-center justify-center p-6', className)}>
        <EmptyState
          icon={MessagesSquare}
          title="Pick a conversation"
          description="Choose someone from the list to read your messages."
          className="w-full max-w-sm"
        />
      </div>
    )
  }

  return (
    <div className={cn('min-w-0 flex-1', className)}>
      <div className="flex h-full flex-col">
        <header className="border-line flex shrink-0 items-center gap-3 border-b p-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="text-ink-muted hover:bg-primary-soft hover:text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors lg:hidden">
            <ArrowLeft className="size-4.5" strokeWidth={1.75} />
          </button>

          <Avatar name={conversation.name} size="md" />

          <div className="min-w-0">
            <p className="text-ink truncate text-[15px] font-medium">{conversation.name}</p>
            <p className="text-ink-subtle truncate text-[12px]">{conversation.participantLabel}</p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {thread.isPending ? (
            <div className="space-y-4" aria-busy="true">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className={cn('h-11 rounded-2xl', index % 2 === 0 ? 'w-3/5' : 'ml-auto w-1/2')} />
              ))}
            </div>
          ) : (
            <ol className="space-y-4">
              {rows.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </ol>
          )}
        </div>

        <MessageComposer />
      </div>
    </div>
  )
}
