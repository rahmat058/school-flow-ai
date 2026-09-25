import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { useConversations } from '@/features/chat/api'

/**
 * The header bell. Its badge totals the caller's unread chat messages — the app has no separate
 * notification model, and conversation `unreadCount` is the only unread source that exists.
 * Refreshes on mount/navigation (the query's 60s staleness); there is no realtime channel yet.
 */
export function NotificationBell() {
  const navigate = useNavigate()
  const conversations = useConversations()
  const unread = (conversations.data ?? []).reduce((total, item) => total + item.unreadCount, 0)

  return (
    <button
      type="button"
      onClick={() => navigate(paths.chat)}
      className="text-ink-muted hover:bg-primary-soft hover:text-primary relative inline-flex size-9 items-center justify-center rounded-md"
      aria-label={unread > 0 ? `Communication — ${unread} unread` : 'Communication'}
      title={unread > 0 ? `${unread} unread` : 'Communication'}>
      <Bell className="size-4.5" strokeWidth={1.75} />

      {unread > 0 ? (
        <span
          className={cn(
            'ring-surface absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white ring-2',
            unreadTone(unread),
          )}>
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </button>
  )
}

/** The hotter the backlog, the hotter the badge — colour marks meaning, never decoration. */
function unreadTone(unread: number): string {
  if (unread >= 10) return 'bg-error'
  if (unread >= 3) return 'bg-warning'
  return 'bg-primary'
}
