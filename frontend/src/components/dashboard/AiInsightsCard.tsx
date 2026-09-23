import { Sparkles } from 'lucide-react'
import type { AiInsight } from '@/types/ai'

interface AiInsightsCardProps {
  insight: AiInsight
}

/** Admin AI insight, grounded in the term's real aggregates. */
export function AiInsightsCard({ insight }: AiInsightsCardProps) {
  return (
    <article className="bg-primary flex h-full flex-col justify-between rounded-xl p-6 text-white">
      <div>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] uppercase">
          <Sparkles className="size-3.5" strokeWidth={1.75} />
          AI insight
        </p>
        <h2 className="font-display mt-4 text-[24px] leading-tight font-semibold tracking-[-0.03em]">
          {insight.title}
        </h2>
        <p className="mt-4 text-[14px] leading-relaxed text-white/80">{insight.body}</p>
      </div>

      <button
        type="button"
        className="text-primary mt-8 flex h-[38px] w-full items-center justify-center rounded-md bg-white text-[14px] font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-primary)]">
        Ask about this
      </button>
    </article>
  )
}
