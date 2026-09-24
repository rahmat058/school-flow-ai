import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  MoreHorizontal,
  ScrollText,
  StickyNote,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
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
  onDownload: (material: MaterialListItem) => void
  onDelete: (material: MaterialListItem) => void
  downloading: boolean
}

export function MaterialCard({ material, canManage, onDownload, onDelete, downloading }: MaterialCardProps) {
  const Icon = TYPE_ICONS[material.type]

  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) transition duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-hover)">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary-soft text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon className="size-4.5" strokeWidth={1.75} />
          </span>

          <div className="min-w-0">
            <h3 className="text-ink line-clamp-2 text-[15px] leading-snug font-medium">{material.title}</h3>
            <p className="text-ink-subtle mt-0.5 text-[12px]">
              {MATERIAL_TYPE_LABELS[material.type]} · {material.subjectName}
            </p>
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

      <dl className="mt-4 space-y-2">
        <MetaRow icon={FileText} value={`Class ${material.className}`} />
        <MetaRow icon={UserRound} value={material.uploadedByName} />
        <MetaRow
          icon={CalendarDays}
          value={`${formatDate(material.createdAt)} · ${formatBytes(material.fileSizeBytes)}`}
        />
      </dl>

      <div className="border-line mt-4 border-t pt-4">
        <Button variant="secondary" className="w-full" onClick={() => onDownload(material)} disabled={downloading}>
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
