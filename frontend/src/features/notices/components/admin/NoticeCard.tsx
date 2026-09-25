import type { LucideIcon } from 'lucide-react'
import { AlertCircle, AlertTriangle, CalendarDays, Info, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { cn } from '@/lib/cn'
import { formatDate, humanizeEnum } from '@/lib/format'
import type { Notice, NoticePriority } from '@/types/communication'

const PRIORITY: Record<NoticePriority, { icon: LucideIcon; chip: string; bar: string }> = {
  HIGH: { icon: AlertTriangle, chip: 'bg-error-soft text-error', bar: 'bg-error' },
  MEDIUM: { icon: AlertCircle, chip: 'bg-warning-soft text-warning', bar: 'bg-warning' },
  LOW: { icon: Info, chip: 'bg-canvas text-ink-muted', bar: 'bg-line' },
}

interface NoticeCardProps {
  notice: Notice
  /** An admin edits and deletes; every other role reads the same card without the control. */
  canManage: boolean
  onEdit: (notice: Notice) => void
  onDelete: (notice: Notice) => void
}

export function NoticeCard({ notice, canManage, onEdit, onDelete }: NoticeCardProps) {
  const { icon: Icon, chip, bar } = PRIORITY[notice.priority]

  return (
    <article className="border-line bg-surface flex overflow-hidden rounded-xl border shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <span className={cn('w-1 shrink-0', bar)} aria-hidden="true" />

      <div className="min-w-0 flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-lg', chip)}>
              <Icon className="size-4.5" strokeWidth={1.75} />
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-ink text-[15px] leading-snug font-medium">{notice.title}</h2>
              <StatusBadge status={notice.priority} />
              {notice.publishedAt ? null : (
                <span className="bg-warning-soft text-warning inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase">
                  Draft
                </span>
              )}
            </div>
          </div>

          {canManage ? (
            <Dropdown
              triggerLabel={`Actions for ${notice.title}`}
              trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
              items={[
                { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => onEdit(notice) },
                {
                  id: 'delete',
                  label: 'Delete',
                  icon: Trash2,
                  danger: true,
                  separatorBefore: true,
                  onSelect: () => onDelete(notice),
                },
              ]}
            />
          ) : null}
        </div>

        <p className="text-ink-muted mt-3 text-[14px] leading-relaxed">{notice.body}</p>

        <div className="border-line mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-ink-subtle inline-flex items-center gap-1.5 text-[12px]">
              <CalendarDays className="size-3.5" strokeWidth={1.75} />
              {notice.publishedAt ? formatDate(notice.publishedAt, 'dd MMM yyyy') : 'Not published'}
            </span>
            <span className="text-ink-subtle text-[12px]">By {notice.authorName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {notice.audience.map((audience) => (
              <span
                key={audience}
                className="bg-canvas text-ink-muted inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase">
                {humanizeEnum(audience)}
              </span>
            ))}
            {notice.classIds.length > 0 ? (
              <span className="text-ink-subtle text-[12px]">{notice.classIds.length} classes targeted</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
