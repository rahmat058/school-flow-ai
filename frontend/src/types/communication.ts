export type NoticeAudience = 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS'

export type NoticePriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Notice {
  id: string
  schoolId: string
  publishedById: string
  title: string
  body: string
  priority: NoticePriority
  audience: NoticeAudience[]
  /** Null while the notice is still a draft. */
  publishedAt: string | null
  expiresAt: string | null
  /** Empty means every class matching `audience`. */
  classIds: string[]
  authorName: string
  /** Soft delete (`Database.md` §11): the row survives, the board stops listing it. */
  deletedAt: string | null
}

/** What the notice board form sends. Audience and class targeting stay the server's defaults. */
export interface NoticeInput {
  title: string
  body: string
  priority: NoticePriority
  authorName: string
}

/** One row in the conversation list — the thread with the other participant already resolved. */
export interface ConversationListItem {
  id: string
  name: string
  /** The line under the name: a student's class, a teacher's subject, or else their role. */
  participantLabel: string
  /** The newest message's body, for the preview line. */
  lastMessage: string
  lastMessageAt: string | null
  /** Messages from the other participant the caller has not read. */
  unreadCount: number
}

/** One message as a thread renders it. */
export interface ChatMessageListItem {
  id: string
  body: string
  /** True when the caller sent it — this drives the bubble's side and tint. */
  mine: boolean
  sentAt: string
  read: boolean
}

/** Named `SchoolEvent` to avoid colliding with the DOM `Event`. */
export interface SchoolEvent {
  id: string
  schoolId: string
  createdById: string
  title: string
  description: string | null
  eventDate: string
  startTime: string | null
  endTime: string | null
  audience: NoticeAudience[]
}

export interface Conversation {
  id: string
  schoolId: string
  participantIds: string[]
  lastMessageAt: string | null
}

/** Named `ChatMessage` to avoid colliding with the DOM `MessageEvent`. */
export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  readAt: string | null
  createdAt: string
}
