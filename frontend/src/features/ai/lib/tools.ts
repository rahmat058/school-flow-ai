import { BookOpen, CalendarDays, ClipboardCheck, Megaphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types/auth'
import type { AiToolId } from '@/types/ai'

/** One field of a tool's form — the descriptor the panel renders. */
export interface AiToolField {
  name: string
  label: string
  placeholder: string
  kind: 'text' | 'number' | 'date' | 'textarea' | 'select'
  options?: string[]
  required?: boolean
}

export interface AiTool {
  id: AiToolId
  label: string
  icon: LucideIcon
  description: string
  /** The action button's label, e.g. "Generate quiz". */
  action: string
  /** The roles the API contract opens this feature to (`PRD.md` §2, §4.12). */
  roles: Role[]
  fields: AiToolField[]
}

/**
 * The four AI tools that own a screen. Their forms are described here rather than hand-written per
 * tool, so one panel renders all four and the shapes stay in step with `POST /ai/*` (`PRD.md` §4.12).
 */
export const AI_TOOLS: AiTool[] = [
  {
    id: 'QUIZ',
    label: 'Quiz Generator',
    icon: ClipboardCheck,
    description: 'Generate topic-specific quizzes instantly.',
    action: 'Generate quiz',
    roles: ['ADMIN', 'TEACHER', 'STUDENT'],
    fields: [
      { name: 'subject', label: 'Subject', placeholder: 'e.g. Science', kind: 'text' },
      { name: 'topic', label: 'Topic', placeholder: 'e.g. Photosynthesis', kind: 'text' },
      { name: 'questions', label: 'Questions', placeholder: '5', kind: 'select', options: ['5', '10', '15'] },
    ],
  },
  {
    id: 'HOMEWORK_HELP',
    label: 'Homework Helper',
    icon: BookOpen,
    description: 'Get step-by-step explanations for your assignments.',
    action: 'Get help',
    roles: ['ADMIN', 'STUDENT'],
    fields: [
      { name: 'subject', label: 'Subject (optional)', placeholder: 'e.g. Mathematics', kind: 'text' },
      {
        name: 'question',
        label: 'Your question',
        placeholder: 'Describe your homework problem…',
        kind: 'textarea',
        required: true,
      },
    ],
  },
  {
    id: 'EVENT_PLAN',
    label: 'Event Planner',
    icon: CalendarDays,
    description: 'Get a complete AI-generated school event plan.',
    action: 'Generate event plan',
    roles: ['ADMIN'],
    fields: [
      { name: 'name', label: 'Event name', placeholder: 'e.g. Independence Day', kind: 'text', required: true },
      {
        name: 'type',
        label: 'Event type',
        placeholder: 'Choose a type',
        kind: 'select',
        required: true,
        options: [
          'Republic / Independence Day',
          'Annual sports day',
          'Science fair',
          'Parent–teacher meeting',
          'Cultural programme',
          'Annual prize giving',
        ],
      },
      { name: 'date', label: 'Event date', placeholder: '', kind: 'date' },
      { name: 'participants', label: 'Expected participants', placeholder: 'e.g. 100', kind: 'number' },
      { name: 'budget', label: 'Estimated budget ($)', placeholder: 'e.g. 5000', kind: 'number' },
    ],
  },
  {
    id: 'NOTICE',
    label: 'Notice Generator',
    icon: Megaphone,
    description: 'Generate professional school announcements.',
    action: 'Generate notice',
    roles: ['ADMIN'],
    fields: [
      {
        name: 'type',
        label: 'Notice type',
        placeholder: 'e.g. exam, holiday, meeting, sports day',
        kind: 'text',
      },
      {
        name: 'details',
        label: 'Details',
        placeholder: 'Provide the key details for the notice…',
        kind: 'textarea',
        required: true,
      },
    ],
  },
]

/** The tools the caller's role opens — the contract scopes each feature (`PRD.md` §2). */
export function aiToolsForRole(role: Role | undefined | null): AiTool[] {
  if (!role) return []

  return AI_TOOLS.filter((tool) => tool.roles.includes(role))
}
