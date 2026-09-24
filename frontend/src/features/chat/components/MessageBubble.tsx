import { CheckCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { ChatMessageListItem } from '@/types/communication'

interface MessageBubbleProps {
  message: ChatMessageListItem
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <li className={cn('flex flex-col', message.mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed sm:max-w-[70%]',
          message.mine ? 'bg-primary rounded-br-sm text-white' : 'bg-line/60 text-ink rounded-bl-sm',
        )}>
        {message.body}
      </div>

      <span className="text-ink-subtle mt-1 inline-flex items-center gap-1 text-[11px]">
        {formatDate(message.sentAt, 'HH:mm')}
        {message.mine ? (
          <CheckCheck
            className={cn('size-3.5', message.read ? 'text-primary' : 'text-ink-subtle')}
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : null}
      </span>
    </li>
  )
}
