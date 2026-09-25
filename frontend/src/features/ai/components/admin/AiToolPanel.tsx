import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { useAiGenerations } from '@/features/ai/api'
import type { AiTool, AiToolField } from '@/features/ai/lib/tools'

interface AiToolPanelProps {
  tool: AiTool
}

/**
 * One tool's screen: its header, its form and the newest result. The form is a design preview —
 * generation arrives with the `AiModule`, so the action is inert rather than pretending to call it.
 */
export function AiToolPanel({ tool }: AiToolPanelProps) {
  const generations = useAiGenerations(tool.id)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(tool.fields.map((field) => [field.name, ''])),
  )

  const shortest = tool.fields.filter((field) => field.kind !== 'textarea')
  const longest = tool.fields.filter((field) => field.kind === 'textarea')
  const latest = generations.data?.[0]

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function renderField(field: AiToolField) {
    const value = values[field.name] || (field.kind === 'select' ? (field.options?.[0] ?? '') : '')

    if (field.kind === 'textarea') {
      return (
        <Textarea
          key={field.name}
          label={field.label}
          rows={4}
          placeholder={field.placeholder}
          value={value}
          onChange={(event) => setValue(field.name, event.target.value)}
        />
      )
    }

    if (field.kind === 'select') {
      return (
        <Select
          key={field.name}
          label={field.label}
          placeholder={field.placeholder || 'Choose…'}
          options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
          value={value}
          onValueChange={(next) => setValue(field.name, next)}
        />
      )
    }

    return (
      <Input
        key={field.name}
        label={field.label}
        type={field.kind === 'date' ? 'date' : field.kind === 'number' ? 'number' : 'text'}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => setValue(field.name, event.target.value)}
      />
    )
  }

  return (
    <div className="space-y-5">
      <section className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)]">
        <header className="flex items-start gap-3">
          <span className="bg-primary-soft text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-full">
            <tool.icon className="size-5" strokeWidth={1.75} />
          </span>

          <div className="min-w-0">
            <h2 className="font-display text-ink text-[17px] font-semibold tracking-[-0.02em]">{tool.label}</h2>
            <p className="text-ink-muted mt-0.5 text-[13px]">{tool.description}</p>
          </div>
        </header>

        <div className="mt-5 space-y-4">
          {shortest.length > 0 ? <div className="grid gap-4 sm:grid-cols-2">{shortest.map(renderField)}</div> : null}
          {longest.map(renderField)}
        </div>

        <div className="mt-5">
          <Button type="button" aria-disabled="true" title="Generation arrives with the AiModule — this is the design.">
            <tool.icon className="size-4" strokeWidth={1.75} />
            {tool.action}
          </Button>
        </div>
      </section>

      {generations.isPending ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : latest ? (
        <section className="border-line bg-surface rounded-xl border shadow-[var(--shadow-card)]">
          <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b p-5">
            <div className="min-w-0">
              <h3 className="text-ink-subtle text-[11px] font-medium tracking-[0.08em] uppercase">Latest result</h3>
              <p className="text-ink mt-1 text-[14px] font-medium">{latest.title}</p>
            </div>

            <Button variant="secondary" aria-disabled="true" title="Copying arrives with the backend.">
              <Copy className="size-4" strokeWidth={1.75} />
              Copy
            </Button>
          </header>

          <pre className="text-ink overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
            {latest.output}
          </pre>
        </section>
      ) : (
        <EmptyState
          icon={tool.icon}
          title="Nothing generated yet"
          description={`Fill the form above — your first ${tool.label.toLowerCase()} result lands here once the AI is connected.`}
        />
      )}
    </div>
  )
}
