import type { LucideIcon } from 'lucide-react'
import { BookOpen, CalendarDays, MoreHorizontal, Pencil, Trash2, UserRound, Users } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { Progress } from '@/components/ui/Progress'
import { formatDate } from '@/lib/format'
import type { HomeworkListItem } from '@/types/homework'

interface HomeworkCardProps {
  assignment: HomeworkListItem
  /** Staff edit and delete; a student or parent reads the same card without the control. */
  canManage: boolean
  onEdit: (assignment: HomeworkListItem) => void
  onDelete: (assignment: HomeworkListItem) => void
}

export function HomeworkCard({ assignment, canManage, onEdit, onDelete }: HomeworkCardProps) {
  const complete = assignment.totalStudents > 0 && assignment.submittedCount === assignment.totalStudents

  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary-soft text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
            <BookOpen className="size-4.5" strokeWidth={1.75} />
          </span>

          <div className="min-w-0">
            <h3 className="text-ink line-clamp-2 text-[15px] leading-snug font-medium">{assignment.title}</h3>
            <p className="text-ink-subtle mt-0.5 text-[12px]">{assignment.subjectName}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge status={assignment.status} />

          {canManage ? (
            <Dropdown
              triggerLabel={`Actions for ${assignment.title}`}
              trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
              items={[
                { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => onEdit(assignment) },
                {
                  id: 'delete',
                  label: 'Delete',
                  icon: Trash2,
                  danger: true,
                  separatorBefore: true,
                  onSelect: () => onDelete(assignment),
                },
              ]}
            />
          ) : null}
        </div>
      </div>

      {assignment.description ? (
        <p className="text-ink-muted mt-3 line-clamp-2 text-[13px] leading-relaxed">{assignment.description}</p>
      ) : null}

      <dl className="mt-4 space-y-2">
        <MetaRow icon={CalendarDays} value={`Due: ${formatDate(assignment.dueDate)}`} />
        <MetaRow icon={Users} value={`Class ${assignment.className}`} />
        <MetaRow icon={UserRound} value={assignment.teacherName} />
      </dl>

      <div className="border-line mt-4 border-t pt-4">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-ink-muted text-[12px]">Submissions</span>
          <span className="text-ink text-[12px] font-medium tabular-nums">
            {assignment.submittedCount}/{assignment.totalStudents}
          </span>
        </div>

        {/* A class with no roster would otherwise divide by zero. */}
        <Progress
          value={assignment.submittedCount}
          max={Math.max(1, assignment.totalStudents)}
          tone={complete ? 'success' : 'primary'}
        />
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
