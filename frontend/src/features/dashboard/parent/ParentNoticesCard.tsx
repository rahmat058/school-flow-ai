import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { ParentNotice } from '@/types/dashboard'

interface ParentNoticesCardProps {
  notices: ParentNotice[]
}

/** The tint a notice's priority dot carries — the same meaning the board's cards use. */
const priorityDot: Record<ParentNotice['priority'], string> = {
  HIGH: 'bg-error',
  MEDIUM: 'bg-warning',
  LOW: 'bg-ink-subtle',
}

/** Published notices a guardian is in the audience of, newest first. */
export function ParentNoticesCard({ notices }: ParentNoticesCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">School notices</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Announcements for guardians</p>
      </div>

      {notices.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">Nothing has been posted yet.</p>
      ) : (
        <ul className="divide-line divide-y">
          {notices.map((notice) => (
            <li key={notice.id} className="flex items-start gap-3 py-3">
              <span
                aria-hidden="true"
                className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', priorityDot[notice.priority])}
              />

              <div className="min-w-0 flex-1">
                <p className="text-ink text-[13px] font-medium">{notice.title}</p>
                <p className="text-ink-muted mt-0.5 line-clamp-2 text-[12px] leading-relaxed">{notice.body}</p>
              </div>

              <span className="text-ink-subtle shrink-0 text-[11px]">{formatDate(notice.publishedAt, 'dd MMM')}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
