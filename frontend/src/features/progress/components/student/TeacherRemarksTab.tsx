import { Quote } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/format'
import type { ProgressRemarkRow } from '@/types/progress'

interface TeacherRemarksTabProps {
  remarks: ProgressRemarkRow[]
}

/** The notes teachers left beside a published mark, newest first. */
export function TeacherRemarksTab({ remarks }: TeacherRemarksTabProps) {
  if (remarks.length === 0) {
    return (
      <p className="border-line bg-surface text-ink-subtle rounded-xl border px-4 py-6 text-[13px]">
        No teacher remarks yet. A note appears here when a teacher leaves one beside a published mark.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {remarks.map((row) => (
        <article key={row.id} className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={row.teacherName} size="md" />
              <div className="min-w-0">
                <p className="text-ink truncate text-[14px] font-medium">{row.teacherName}</p>
                <p className="text-ink-muted truncate text-[12.5px]">
                  {row.subjectName} · {row.examName}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="bg-primary-soft text-primary rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                {row.marks} / {row.total}
              </span>
              <span className="text-ink-subtle text-[12px] whitespace-nowrap">{formatDate(row.date)}</span>
            </div>
          </header>

          <blockquote className="mt-4 flex gap-3">
            <Quote className="text-ink-subtle mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-ink-muted text-[13.5px] leading-relaxed">{row.remark}</p>
          </blockquote>
        </article>
      ))}
    </div>
  )
}
