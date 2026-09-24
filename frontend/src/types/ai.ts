export type AiFeature = 'CHAT' | 'REPORT_COMMENT' | 'FEE_REMINDER' | 'NOTICE' | 'EVENT_PLAN' | 'HOMEWORK_HELP' | 'QUIZ'

/** The four features that own a form and a panel on the assistant screen. */
export type AiToolId = 'QUIZ' | 'HOMEWORK_HELP' | 'EVENT_PLAN' | 'NOTICE'

/** One stored turn — `ai_conversations.messages`, a JSONB array of these. */
export interface AiMessageTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AiConversation {
  id: string
  schoolId: string
  userId: string
  feature: AiFeature
  title: string | null
  /** The tool form's own fields, so a past generation can be reopened with its inputs. */
  promptArgs: Record<string, string>
  messages: AiMessageTurn[]
  createdAt: string
  updatedAt: string
}

/** A generation as the assistant renders it: the stored row plus its last reply. */
export interface AiGeneration {
  id: string
  feature: AiFeature
  title: string
  promptArgs: Record<string, string>
  /** Markdown text. The panel shows it in a monospace block, so no renderer is needed. */
  output: string
  createdAt: string
}

/** Dashboard insight card content — produced by the admin AI chat feature. */
export interface AiInsight {
  title: string
  body: string
  prompt: string
}
