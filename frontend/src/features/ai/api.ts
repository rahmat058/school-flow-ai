import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { AiContext, AiGeneration, AiToolId } from '@/types/ai'

export const aiKeys = {
  all: ['ai'] as const,
  context: () => [...aiKeys.all, 'context'] as const,
  generations: (feature: AiToolId) => [...aiKeys.all, 'generations', feature] as const,
}

/**
 * The caller's own context for the assistant's forms — `GET /ai/context`: a student's class and its
 * subjects, or the school catalogue for staff. Read once for the screen, not per tool.
 */
export function useAiContext() {
  return useQuery({
    queryKey: aiKeys.context(),
    queryFn: async (): Promise<AiContext> => (await get<AiContext>('/ai/context')).data,
    staleTime: 5 * 60_000,
  })
}

/**
 * The caller's own past generations for one tool, newest first — `GET /ai/conversations?feature=`.
 * A form tool shows the newest as its result; a chat tool renders its turns.
 */
export function useAiGenerations(feature: AiToolId) {
  return useQuery({
    queryKey: aiKeys.generations(feature),
    queryFn: async (): Promise<AiGeneration[]> => (await get<AiGeneration[]>('/ai/conversations', { feature })).data,
    staleTime: 5 * 60_000,
  })
}
