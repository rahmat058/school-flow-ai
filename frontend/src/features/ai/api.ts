import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { AiGeneration, AiToolId } from '@/types/ai'

export const aiKeys = {
  all: ['ai'] as const,
  generations: (feature: AiToolId) => [...aiKeys.all, 'generations', feature] as const,
}

/**
 * The caller's own past generations for one tool, newest first — `GET /ai/conversations?feature=`.
 * The panel shows the newest as its result, so the screen has content before the AI is wired up.
 */
export function useAiGenerations(feature: AiToolId) {
  return useQuery({
    queryKey: aiKeys.generations(feature),
    queryFn: async (): Promise<AiGeneration[]> => (await get<AiGeneration[]>('/ai/conversations', { feature })).data,
    staleTime: 5 * 60_000,
  })
}
