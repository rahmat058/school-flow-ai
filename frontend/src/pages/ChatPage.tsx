import { useState } from 'react'
import { cn } from '@/lib/cn'
import { useConversations } from '@/features/chat/api'
import { ChatWindow } from '@/features/chat/components/ChatWindow'
import { ConversationList } from '@/features/chat/components/ConversationList'

export function ChatPage() {
  const conversations = useConversations()
  const [search, setSearch] = useState('')
  const [pickedId, setPickedId] = useState<string | null>(null)
  // The desktop layout opens on the newest thread, the way the design reads; a phone shows the list
  // first, so a thread is only opened by an explicit tap.
  const [wide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)

  const threads = conversations.data
  const term = search.trim().toLowerCase()
  const items = (threads ?? []).filter((thread) => thread.name.toLowerCase().includes(term))

  const fallbackId = wide ? (items[0]?.id ?? null) : null
  const selectedId = items.some((thread) => thread.id === pickedId) ? pickedId : fallbackId
  const active = items.find((thread) => thread.id === selectedId) ?? null

  return (
    <div className="border-line bg-surface flex h-[calc(100dvh-7rem)] overflow-hidden rounded-xl border shadow-(--shadow-card) lg:h-[calc(100dvh-8.5rem)]">
      <ConversationList
        items={items}
        activeId={selectedId}
        search={search}
        onSearchChange={setSearch}
        onSelect={setPickedId}
        loading={conversations.isPending}
        className={cn('border-line w-full border-r lg:w-80 xl:w-90', active ? 'hidden lg:flex' : 'flex')}
      />

      <ChatWindow
        conversation={active}
        onBack={() => setPickedId(null)}
        className={active ? 'block' : 'hidden lg:block'}
      />
    </div>
  )
}
