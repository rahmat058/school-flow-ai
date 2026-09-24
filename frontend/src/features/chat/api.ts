import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { ChatMessageListItem, ConversationListItem } from '@/types/communication'

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
}

/** The caller's conversations, newest activity first — `GET /chat/conversations`. */
export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: async (): Promise<ConversationListItem[]> =>
      (await get<ConversationListItem[]>('/chat/conversations')).data,
    staleTime: 60_000,
  })
}

/** One thread's history, oldest message first — `GET /chat/:conversationId/messages`. */
export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ''),
    queryFn: async (): Promise<ChatMessageListItem[]> =>
      (await get<ChatMessageListItem[]>(`/chat/${conversationId}/messages`)).data,
    enabled: conversationId !== null,
    staleTime: 60_000,
  })
}
