export type AiFeature = 'CHAT' | 'REPORT_COMMENT' | 'FEE_REMINDER' | 'NOTICE' | 'EVENT_PLAN' | 'HOMEWORK_HELP' | 'QUIZ'

export interface AiConversation {
  id: string
  schoolId: string
  userId: string
  feature: AiFeature
  title: string | null
  messageCount: number
  createdAt: string
  updatedAt: string
}

/** Dashboard insight card content — produced by the admin AI chat feature. */
export interface AiInsight {
  title: string
  body: string
  prompt: string
}
