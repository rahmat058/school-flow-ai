export type AiFeature = 'CHAT' | 'REPORT_COMMENT' | 'FEE_REMINDER' | 'NOTICE' | 'EVENT_PLAN' | 'HOMEWORK_HELP' | 'QUIZ'

/** The five features that own a screen in the assistant. */
export type AiToolId = 'CHAT' | 'QUIZ' | 'HOMEWORK_HELP' | 'EVENT_PLAN' | 'NOTICE'

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
  /** The stored turns, oldest first — the chat tools render these; the form tools read `output`. */
  messages: AiMessageTurn[]
  /** Markdown text. The panel renders it, so the reply can carry headings, lists and tables. */
  output: string
  createdAt: string
}

/**
 * What the assistant's own forms need to know about the caller — `GET /ai/context`. A student's
 * tools fill a class from it (a class chip, the quiz's subject list); staff have no class of their
 * own, so they get the whole subject catalogue and a null class.
 */
export interface AiContext {
  classId: string | null
  /** Display label for a student's class (`5-B`), null for staff. */
  className: string | null
  /** A student's class subjects, or the school catalogue for staff. */
  subjects: Array<{ id: string; name: string }>
}

/** Dashboard insight card content — produced by the admin AI chat feature. */
export interface AiInsight {
  title: string
  body: string
  prompt: string
}
