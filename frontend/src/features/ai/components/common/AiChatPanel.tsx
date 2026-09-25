import { useState } from 'react'
import { ArrowUp, Brain } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useAiGenerations } from '@/features/ai/api'
import { AiMarkdown } from '@/features/ai/components/common/AiMarkdown'
import type { AiTool } from '@/features/ai/lib/tools'

interface AiChatPanelProps {
  tool: AiTool
}

/**
 * A conversational tool's screen — the AI Tutor. The thread shows the caller's newest stored
 * conversation; sending is inert until the `AiModule` lands, like every other action here.
 */
export function AiChatPanel({ tool }: AiChatPanelProps) {
  const generations = useAiGenerations(tool.id)
  const [draft, setDraft] = useState('')

  const turns = generations.data?.[0]?.messages ?? []

  return (
    <section className="border-line bg-surface flex h-[34rem] flex-col rounded-xl border shadow-[var(--shadow-card)]">
      <header className="border-line flex items-center gap-3 border-b p-5">
        <span className="bg-primary-soft text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-full">
          <tool.icon className="size-5" strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-ink text-[17px] font-semibold tracking-[-0.02em]">{tool.label} Chat</h2>
          <p className="text-ink-muted mt-0.5 text-[13px]">{tool.description}</p>
        </div>

        {/* The reference's mode picker has no contract behind it, so the scope reads as a plain chip. */}
        <span className="bg-canvas text-ink-muted shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium">
          General
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {generations.isPending ? (
          <div className="space-y-4" aria-busy="true">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className={cn('h-11 rounded-2xl', index % 2 === 0 ? 'w-3/5' : 'ml-auto w-1/2')} />
            ))}
          </div>
        ) : turns.length === 0 ? (
          <EmptyState
            className="border-0 bg-transparent"
            icon={Brain}
            title="Ask me anything about your studies!"
            description="The tutor answers with your class and subjects in mind — it switches on with the AiModule."
          />
        ) : (
          turns.map((turn, index) => (
            <div key={index} className={cn('flex flex-col', turn.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed sm:max-w-[80%]',
                  turn.role === 'user' ? 'bg-primary rounded-br-sm text-white' : 'bg-line/60 text-ink rounded-bl-sm',
                )}>
                {turn.role === 'assistant' ? <AiMarkdown text={turn.content} /> : turn.content}
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="border-line border-t p-4">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask a question..."
          aria-label="Ask the AI tutor"
          trailing={
            <button
              type="button"
              aria-disabled="true"
              aria-label="Send"
              title="Chat arrives with the AiModule — this is the design."
              className="bg-primary inline-flex size-8 items-center justify-center rounded-full text-white">
              <ArrowUp className="size-4" strokeWidth={2} />
            </button>
          }
        />
      </footer>
    </section>
  )
}
