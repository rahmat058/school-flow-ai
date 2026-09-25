import { useState } from 'react'
import { Copy, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { useAiContext, useAiGenerations } from '@/features/ai/api'
import { useHomework } from '@/features/homework/api'
import { AiMarkdown } from '@/features/ai/components/common/AiMarkdown'
import type { AiTool, AiToolField } from '@/features/ai/lib/tools'
import type { HomeworkListItem } from '@/types/homework'

interface AiFormPanelProps {
  tool: AiTool
}

/**
 * One form tool's screen: its header, its form and the newest result. The form is a design preview —
 * generation arrives with the `AiModule`, so the action is inert rather than pretending to call it.
 * The option lists are real though: a student's subjects come from their class context, and the
 * homework picker from their own assignments.
 */
export function AiFormPanel({ tool }: AiFormPanelProps) {
  const generations = useAiGenerations(tool.id)
  const context = useAiContext()
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(tool))

  const latest = generations.data?.[0]
  const shortest = tool.fields.filter((field) => field.kind !== 'textarea')
  const longest = tool.fields.filter((field) => field.kind === 'textarea')

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  /** Picking an assignment copies its subject and description into the fields that want them. */
  function pickHomework(field: AiToolField, item: HomeworkListItem) {
    setValues((current) => {
      const next: Record<string, string> = { ...current, [field.name]: item.id }
      for (const [target, attribute] of Object.entries(field.prefill ?? {})) {
        next[target] = String((item as unknown as Record<string, unknown>)[attribute] ?? '')
      }
      return next
    })
  }

  function renderField(field: AiToolField) {
    const value = values[field.name] ?? ''

    if (field.optionsFrom === 'homework') {
      return (
        <HomeworkSelect key={field.name} field={field} value={value} onPick={(item) => pickHomework(field, item)} />
      )
    }

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
      const options =
        field.optionsFrom === 'subjects'
          ? (context.data?.subjects ?? []).map((subject) => ({ value: subject.id, label: subject.name }))
          : (field.options ?? []).map((option) => ({ value: option, label: option }))

      return (
        <Select
          key={field.name}
          label={field.label}
          placeholder={field.optionsFrom === 'subjects' && context.isPending ? 'Loading subjects…' : field.placeholder}
          options={options}
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

        {context.data?.className ? (
          <p className="bg-canvas text-ink-muted mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium">
            <GraduationCap className="size-3.5" strokeWidth={1.75} />
            Class {context.data.className}
          </p>
        ) : null}

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

          <div className="p-5">
            <AiMarkdown text={latest.output} />
          </div>
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

/** The empty form: a static select opens on its first option, a data-backed one waits for a choice. */
function initialValues(tool: AiTool): Record<string, string> {
  return Object.fromEntries(
    tool.fields.map((field) => [
      field.name,
      field.kind === 'select' && !field.optionsFrom ? (field.options?.[0] ?? '') : '',
    ]),
  )
}

/**
 * The picker over the student's own assignments. It owns its query so no other tool's form fetches
 * the homework list, and it hands back the whole row so the caller can prefill from it.
 */
function HomeworkSelect({
  field,
  value,
  onPick,
}: {
  field: AiToolField
  value: string
  onPick: (item: HomeworkListItem) => void
}) {
  const homework = useHomework()
  const items = homework.data ?? []

  return (
    <Select
      label={field.label}
      placeholder={homework.isPending ? 'Loading assignments…' : field.placeholder}
      options={items.map((item) => ({ value: item.id, label: `${item.subjectName}: ${item.title}` }))}
      value={value}
      onValueChange={(next) => {
        const picked = items.find((item) => item.id === next)
        if (picked) onPick(picked)
      }}
    />
  )
}
