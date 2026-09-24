import type { ChatMessage, Conversation } from '@/types/communication'
import { SCHOOL_ID, dateTimeOffset } from '@/data/seed'

export const conversations: Conversation[] = [
  {
    id: 'cnv_1',
    schoolId: SCHOOL_ID,
    participantIds: ['usr_admin_1', 'usr_tch_1'],
    lastMessageAt: dateTimeOffset(0, 9, 12),
  },
  {
    id: 'cnv_2',
    schoolId: SCHOOL_ID,
    participantIds: ['usr_tch_1', 'usr_par_1'],
    lastMessageAt: dateTimeOffset(-1, 19, 40),
  },
  {
    id: 'cnv_3',
    schoolId: SCHOOL_ID,
    participantIds: ['usr_tch_2', 'usr_std_7'],
    lastMessageAt: dateTimeOffset(-2, 16, 5),
  },
]

export const messages: ChatMessage[] = [
  {
    id: 'msg_1',
    conversationId: 'cnv_1',
    senderId: 'usr_admin_1',
    body: 'Good morning. Could you share the class 5-A attendance summary for last week?',
    readAt: dateTimeOffset(0, 9, 5),
    createdAt: dateTimeOffset(0, 8, 52),
  },
  {
    id: 'msg_2',
    conversationId: 'cnv_1',
    senderId: 'usr_tch_1',
    body: 'Morning. Overall 94% — two absences on Tuesday, both informed.',
    readAt: dateTimeOffset(0, 9, 20),
    createdAt: dateTimeOffset(0, 9, 8),
  },
  {
    id: 'msg_3',
    conversationId: 'cnv_1',
    senderId: 'usr_admin_1',
    body: 'Perfect, thank you.',
    readAt: null,
    createdAt: dateTimeOffset(0, 9, 12),
  },
  {
    id: 'msg_4',
    conversationId: 'cnv_2',
    senderId: 'usr_par_1',
    body: 'Hello, is the fractions worksheet due this week?',
    readAt: dateTimeOffset(-1, 19, 45),
    createdAt: dateTimeOffset(-1, 19, 22),
  },
  {
    id: 'msg_5',
    conversationId: 'cnv_2',
    senderId: 'usr_tch_1',
    body: 'Yes, due Thursday. Submission can be uploaded from the homework page.',
    readAt: null,
    createdAt: dateTimeOffset(-1, 19, 40),
  },
  {
    id: 'msg_6',
    conversationId: 'cnv_3',
    senderId: 'usr_std_7',
    body: 'Sir, I could not attend the practical. How do I make it up?',
    readAt: dateTimeOffset(-2, 16, 20),
    createdAt: dateTimeOffset(-2, 15, 58),
  },
  {
    id: 'msg_7',
    conversationId: 'cnv_3',
    senderId: 'usr_tch_2',
    body: 'No problem — join Thursday\u2019s session and we will sign off your record book.',
    readAt: null,
    createdAt: dateTimeOffset(-2, 16, 5),
  },
]
