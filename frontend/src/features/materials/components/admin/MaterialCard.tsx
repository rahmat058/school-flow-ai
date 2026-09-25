import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  ClipboardList,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  ScrollText,
  StickyNote,
  Trash2,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { cn } from '@/lib/cn'
import { formatBytes, formatDate } from '@/lib/format'
import { MATERIAL_TYPE_LABELS } from '@/lib/options'
import type { MaterialListItem, MaterialType } from '@/types/materials'

const TYPE_ICONS: Record<MaterialType, LucideIcon> = {
  PDF: FileText,
  NOTES: StickyNote,
  WORKSHEET: ClipboardList,
  PAPER: ScrollText,
}

interface MaterialCardProps {
  material: MaterialListItem
  /** Staff remove an upload; a student or parent reads the same card without the control. */
  canManage: boolean
  onPreview: (material: MaterialListItem) => void
  onDownload: (material: MaterialListItem) => void
  onDelete: (material: MaterialListItem) => void
  downloading: boolean
}

export function MaterialCard({ material, canManage, onPreview, onDownload, onDelete, downloading }: MaterialCardProps) {
  const Icon = TYPE_ICONS[material.type]

  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) transition duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-hover)">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white">
            <Icon className="size-4.5" strokeWidth={1.75} />
          </span>

          <div className="min-w-0">
            <h3 className="text-ink line-clamp-2 text-[15px] leading-snug font-medium">{material.title}</h3>
          </div>
        </div>

        {canManage ? (
          <Dropdown
            triggerLabel={`Actions for ${material.title}`}
            trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
            items={[
              {
                id: 'delete',
                label: 'Delete',
                icon: Trash2,
                danger: true,
                onSelect: () => onDelete(material),
              },
            ]}
          />
        ) : null}
      </div>

      {material.description ? (
        <p className="text-ink-muted mt-3 line-clamp-2 text-[13px] leading-relaxed">{material.description}</p>
      ) : null}

      {/* Hard fills rather than the palette's `-soft` tints, which sit within a few percent of white and
          read as nothing on a card. The three tags classify the row — type, subject, class. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Tag tone="primary">{MATERIAL_TYPE_LABELS[material.type]}</Tag>
        <Tag tone="accent">{material.subjectName}</Tag>
        <Tag tone="neutral">Class {material.className}</Tag>
      </div>

      <dl className="mt-4 space-y-2">
        <MetaRow icon={UserRound} value={material.uploadedByName} />
        <MetaRow
          icon={CalendarDays}
          value={`${formatDate(material.createdAt)} · ${formatBytes(material.fileSizeBytes)}`}
        />
      </dl>

      <div className="border-line mt-4 flex gap-2 border-t pt-4">
        <Button variant="secondary" className="flex-1" onClick={() => onPreview(material)}>
          <Eye className="size-4" strokeWidth={1.75} />
          Preview
        </Button>

        <Button className="flex-1" onClick={() => onDownload(material)} disabled={downloading}>
          <Download className="size-4" strokeWidth={1.75} />
          {downloading ? 'Preparing…' : 'Download'}
        </Button>
      </div>
    </article>
  )
}

interface MetaRowProps {
  icon: LucideIcon
  value: string
}

function MetaRow({ icon: Icon, value }: MetaRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
      <dd className="text-ink-muted truncate text-[12.5px]">{value}</dd>
    </div>
  )
}

/**
 * The card's tags carry **hard fills**, because the palette's `-soft` tints sit within a few percent
 * of white and read as nothing on a card. The three accents classify a row — the material's kind, its
 * subject, its class — and are deliberately not the status vocabulary, which stays on `StatusBadge`.
 */
const TAG_TONES = {
  primary: 'bg-primary text-white',
  accent: 'bg-secondary text-white',
  neutral: 'bg-ink-muted text-white',
} as const

function Tag({ tone, children }: { tone: keyof typeof TAG_TONES; children: ReactNode }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', TAG_TONES[tone])}>
      {children}
    </span>
  )
}
