import { useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCurrentUser } from '@/store/auth'
import { AiChatPanel } from '@/features/ai/components/common/AiChatPanel'
import { AiFormPanel } from '@/features/ai/components/common/AiFormPanel'
import { AiToolList } from '@/features/ai/components/common/AiToolList'
import { aiToolsForRole } from '@/features/ai/lib/tools'
import type { AiToolId } from '@/types/ai'

export function AiAssistantPage() {
  const user = useCurrentUser()
  // The contract scopes each feature to a role, so a student sees their three tools and staff theirs.
  const tools = aiToolsForRole(user?.role)
  const [picked, setPicked] = useState<AiToolId | null>(null)
  const active = tools.find((tool) => tool.id === picked) ?? tools[0] ?? null

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink flex items-center gap-2 text-[24px] font-semibold tracking-[-0.03em]">
          <Sparkles className="text-primary size-5" strokeWidth={1.75} />
          AI Assistant
        </h1>
        <p className="text-ink-muted text-[14px]">Supercharge your school experience with AI-powered tools.</p>
      </header>

      {active === null ? (
        <EmptyState
          icon={Bot}
          title="No AI tools for your role"
          description="The assistant is open to staff and students — guardians get their child's tools in a later phase."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
          <AiToolList tools={tools} activeId={active.id} onSelect={setPicked} />

          {/* Keyed on the tool so its form starts empty rather than carrying the last one's values. */}
          {active.panel === 'chat' ? (
            <AiChatPanel key={active.id} tool={active} />
          ) : (
            <AiFormPanel key={active.id} tool={active} />
          )}
        </div>
      )}
    </div>
  )
}
