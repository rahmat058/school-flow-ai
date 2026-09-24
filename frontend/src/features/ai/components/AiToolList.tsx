import { cn } from '@/lib/cn'
import type { AiTool } from '@/features/ai/lib/tools'
import type { AiToolId } from '@/types/ai'

interface AiToolListProps {
  tools: AiTool[]
  activeId: AiToolId | null
  onSelect: (id: AiToolId) => void
}

/** The AI TOOLS rail — one card per tool the caller's role may use. */
export function AiToolList({ tools, activeId, onSelect }: AiToolListProps) {
  return (
    <section>
      <h2 className="text-ink-subtle mb-3 text-[11px] font-medium tracking-[0.08em] uppercase">AI tools</h2>

      <div className="space-y-2">
        {tools.map((tool) => {
          const active = tool.id === activeId

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool.id)}
              aria-pressed={active}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                active
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-surface text-ink-muted hover:border-primary hover:text-primary',
              )}>
              <tool.icon className="size-4.5 shrink-0" strokeWidth={1.75} />
              <span className="text-[13.5px] font-medium">{tool.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
