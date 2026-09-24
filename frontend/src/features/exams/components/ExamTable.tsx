import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
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
  const columns: Array<DataTableColumn<ExamListItem>> = [
    {
      id: 'title',
      header: 'Title',
      sortValue: (row) => row.name,
      cell: (row) => <span className="text-ink font-medium">{row.name}</span>,
    },
    { id: 'class', header: 'Class', sortValue: (row) => row.className, cell: (row) => row.className },
    {
      id: 'type',
      header: 'Type',
      sortValue: (row) => row.type,
      cell: (row) => (
        <span className="bg-canvas text-ink-muted inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium">
          {EXAM_TYPE_LABELS[row.type]}
        </span>
      ),
    },
    {
      id: 'subjects',
      header: 'Subjects',
      // The schedule rides on the row: each chip holds its paper's date, marks and duration in its title.
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.subjects.map((subject) => (
            <span
              key={subject.id}
              title={`${subject.subjectName} · ${formatDate(subject.examDate, 'dd MMM yyyy')} · ${subject.maxMarks} marks · ${subject.durationMin} min`}
              className="bg-primary-soft text-primary inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
              {subject.subjectName}
            </span>
          ))}
        </span>
      ),
    },
    {
      id: 'start',
      header: 'Start',
      sortValue: (row) => row.startDate,
      cell: (row) => (
        <span className="text-ink-muted whitespace-nowrap">{formatDate(row.startDate, 'dd MMM yyyy')}</span>
      ),
    },
    {
      id: 'end',
      header: 'End',
      sortValue: (row) => row.endDate,
      cell: (row) => <span className="text-ink-muted whitespace-nowrap">{formatDate(row.endDate, 'dd MMM yyyy')}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    ...(canManage
      ? [
          {
            id: 'actions',
            header: 'Actions',
            align: 'right' as const,
            cell: (row: ExamListItem) => (
              <div className="flex justify-end">
                <Dropdown
                  triggerLabel={`Actions for ${row.name}`}
                  trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
                  items={[
                    { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => onEdit(row) },
                    {
                      id: 'delete',
                      label: 'Delete',
                      icon: Trash2,
                      danger: true,
                      separatorBefore: true,
                      onSelect: () => onDelete(row),
                    },
                  ]}
                />
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      pageSize={8}
      emptyTitle="No exams scheduled"
      emptyDescription="Schedule one with “New exam” — it appears here with its subject schedule."
    />
  )
}
