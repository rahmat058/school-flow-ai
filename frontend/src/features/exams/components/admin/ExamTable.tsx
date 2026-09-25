import { Fragment, useState } from 'react'
import { BookOpen, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { EXAM_TYPE_LABELS } from '@/lib/options'
import type { ExamListItem } from '@/types/exams'

interface ExamTableProps {
  rows: ExamListItem[]
  canManage: boolean
  loading: boolean
  onEdit: (exam: ExamListItem) => void
  onDelete: (exam: ExamListItem) => void
}

export function ExamTable({ rows, canManage, loading, onEdit, onDelete }: ExamTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No exams scheduled"
        description="Schedule one with “New exam” — it appears here with its subject schedule."
      />
    )
  }

  return (
    <div className="border-line overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Title</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((exam) => {
            const expanded = exam.id === expandedId

            return (
              <Fragment key={exam.id}>
                <TableRow>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : exam.id)}
                      aria-expanded={expanded}
                      className="text-ink hover:text-primary flex items-center gap-2 text-left text-[14px] font-medium">
                      <ChevronRight
                        className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-90')}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{exam.name}</span>
                    </button>
                  </TableCell>
                  <TableCell className="text-ink-muted">{exam.className}</TableCell>
                  <TableCell>
                    <span className="bg-canvas text-ink-muted inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                      {EXAM_TYPE_LABELS[exam.type]}
                    </span>
                  </TableCell>
                  <TableCell className="text-ink-muted whitespace-nowrap">
                    {formatDate(exam.startDate, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-ink-muted whitespace-nowrap">
                    {formatDate(exam.endDate, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={exam.status} />
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Dropdown
                          triggerLabel={`Actions for ${exam.name}`}
                          trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
                          items={[
                            { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => onEdit(exam) },
                            {
                              id: 'delete',
                              label: 'Delete',
                              icon: Trash2,
                              danger: true,
                              separatorBefore: true,
                              onSelect: () => onDelete(exam),
                            },
                          ]}
                        />
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>

                {expanded ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={canManage ? 7 : 6} className="bg-canvas/60">
                      <p className="text-ink mb-2 text-[13px] font-semibold">Subject schedule</p>

                      <div className="flex flex-wrap gap-2">
                        {exam.subjects.map((subject) => (
                          <span
                            key={subject.id}
                            className="border-line bg-surface inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px]">
                            <BookOpen className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                            <span className="text-ink font-medium">{subject.subjectName}</span>
                            <span className="text-ink-muted">
                              {formatDate(subject.examDate, 'dd MMM yyyy')} · {subject.maxMarks} marks ·{' '}
                              {subject.durationMin} min
                            </span>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
