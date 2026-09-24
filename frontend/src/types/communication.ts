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
