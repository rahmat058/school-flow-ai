import { BookMarked, X } from 'lucide-react'
import type { Subject } from '@/types/academic'

interface SubjectChipProps {
  subject: Subject
  /** Omitted when the chip is a read-only label rather than a removable assignment. */
  onRemove?: () => void
  removing?: boolean
}

/** A subject as a small tag — its name over its code, with an optional remove control. */
export function SubjectChip({ subject, onRemove, removing = false }: SubjectChipProps) {
  return (
    <span className="border-line bg-canvas text-ink-muted inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px]">
      <BookMarked className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="font-medium">{subject.name}</span>
      <span className="text-ink-subtle text-[11px] tracking-[0.04em]">{subject.code}</span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remove ${subject.name}`}
          className="text-ink-subtle hover:bg-primary-soft hover:text-primary -mr-1 rounded p-0.5 transition-colors disabled:opacity-50">
          <X className="size-3.5" strokeWidth={2} />
        </button>
      ) : null}
    </span>
  )
}
