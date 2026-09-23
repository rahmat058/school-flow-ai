import type { AiConversation, AiInsight } from '@/types/ai'
import { SCHOOL_ID, dateTimeOffset } from '@/data/seed'

/** History per user per feature (the backend stores turns as JSONB). */
export const aiConversations: AiConversation[] = [
  {
    id: 'aic_1',
    schoolId: SCHOOL_ID,
    userId: 'usr_admin_1',
    feature: 'CHAT',
    title: 'Which classes are behind on fee collection?',
    messageCount: 6,
    createdAt: dateTimeOffset(-3, 11, 0),
    updatedAt: dateTimeOffset(-3, 11, 12),
  },
  {
    id: 'aic_2',
    schoolId: SCHOOL_ID,
    userId: 'usr_admin_1',
    feature: 'FEE_REMINDER',
    title: 'Reminder for the second term invoices',
    messageCount: 2,
    createdAt: dateTimeOffset(-2, 15, 30),
    updatedAt: dateTimeOffset(-2, 15, 33),
  },
  {
    id: 'aic_3',
    schoolId: SCHOOL_ID,
    userId: 'usr_tch_1',
    feature: 'QUIZ',
    title: 'Fractions quiz — class 5A',
    messageCount: 4,
    createdAt: dateTimeOffset(-1, 9, 15),
    updatedAt: dateTimeOffset(-1, 9, 22),
  },
  {
    id: 'aic_4',
    schoolId: SCHOOL_ID,
    userId: 'usr_std_1',
    feature: 'HOMEWORK_HELP',
    title: 'Explaining equivalent fractions',
    messageCount: 8,
    createdAt: dateTimeOffset(-1, 20, 5),
    updatedAt: dateTimeOffset(-1, 20, 24),
  },
]

/** Powers the dashboard insight card — grounded in the aggregate numbers, per the AI contract. */
export const dashboardInsight: AiInsight = {
  title: 'Fee collection is trending up',
  body: 'Collection is 12% ahead of last term, but 6 invoices are overdue and overdue balances sit with classes 7A and 7B. Attendance dipped slightly on Tuesday.',
  prompt: 'Summarise fee collection and attendance risks for this term',
}
