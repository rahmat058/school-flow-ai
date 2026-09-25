import { useState } from 'react'
import { CalendarDays, Clock, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useDeleteExam, useTests } from '@/features/exams/api'
import { TestFormSheet } from '@/features/exams/components/admin/TestFormSheet'
import { useSubjects } from '@/features/subjects/api'
import type { TestListItem } from '@/types/exams'

const PAGE_SIZE = 8

export function TestsTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast()
  const classOptions = useClassOptions()
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TestListItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TestListItem | null>(null)

  const tests = useTests({ classId, subjectId })
  const deleteTest = useDeleteExam()
  // The subject filter follows the class, the way the form does.
  const filterSubjects = useSubjects(classId ? { classId } : {})
  const rows = tests.data ?? []

  const classSelectOptions = [
    { value: '', label: 'All classes' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]
  const subjectSelectOptions = [
    { value: '', label: 'All subjects' },
    ...(filterSubjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name })),
  ]

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteTest.mutateAsync(pendingDelete.id)
      toast({ tone: 'success', title: `${pendingDelete.name} removed` })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove this test',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  const columns: Array<DataTableColumn<TestListItem>> = [
    {
      id: 'title',
      header: 'Title',
      sortValue: (row) => row.name,
      cell: (row) => <span className="text-ink font-medium">{row.name}</span>,
    },
    {
      id: 'subject',
      header: 'Subject',
      sortValue: (row) => row.subjectName,
      cell: (row) => (
        <span className="bg-primary-soft text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium">
          {row.subjectName}
        </span>
      ),
    },
    { id: 'class', header: 'Class', sortValue: (row) => row.className, cell: (row) => row.className },
    {
      id: 'date',
      header: 'Date',
      sortValue: (row) => row.examDate,
      cell: (row) => (
        <span className="text-ink-muted inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap">
          <CalendarDays className="text-ink-subtle size-3.5" strokeWidth={1.75} />
          {formatDate(row.examDate)}
        </span>
      ),
    },
    {
      id: 'marks',
      header: 'Marks',
      align: 'right',
      sortValue: (row) => row.maxMarks,
      cell: (row) => <span className="tabular-nums">{row.maxMarks}</span>,
    },
    {
      id: 'duration',
      header: 'Duration',
      sortValue: (row) => row.durationMin,
      cell: (row) => (
        <span className="text-ink-muted inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap">
          <Clock className="text-ink-subtle size-3.5" strokeWidth={1.75} />
          {row.durationMin} min
        </span>
      ),
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
            cell: (row: TestListItem) => (
              <div className="flex justify-end">
                <Dropdown
                  triggerLabel={`Actions for ${row.name}`}
                  trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
                  items={[
                    {
                      id: 'edit',
                      label: 'Edit',
                      icon: Pencil,
                      onSelect: () => {
                        setEditing(row)
                        setFormOpen(true)
                      },
                    },
                    {
                      id: 'delete',
                      label: 'Delete',
                      icon: Trash2,
                      danger: true,
                      separatorBefore: true,
                      onSelect: () => setPendingDelete(row),
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select
            className="w-45 shrink-0"
            options={classSelectOptions}
            value={classId}
            onValueChange={(value) => {
              setClassId(value)
              setSubjectId('')
            }}
            aria-label="Filter by class"
          />
          <Select
            className="w-45 shrink-0"
            options={subjectSelectOptions}
            value={subjectId}
            onValueChange={setSubjectId}
            disabled={!classId}
            aria-label="Filter by subject"
          />
        </div>

        {canManage ? (
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}>
            <Plus className="size-4" strokeWidth={1.75} />
            New test
          </Button>
        ) : null}
      </div>

      {tests.isError ? (
        <Alert tone="error" title="Could not load tests">
          {tests.error instanceof ApiError ? tests.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        loading={tests.isPending}
        pageSize={PAGE_SIZE}
        emptyTitle="No tests yet"
        emptyDescription="Create a class test — it appears here with its marks and duration."
      />

      {/* Keyed on the target so the form remounts with that test's values. */}
      <TestFormSheet key={editing?.id ?? 'new'} open={formOpen} test={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this test?"
        description={
          pendingDelete ? `${pendingDelete.name} leaves the tests list, along with any marks entered.` : undefined
        }
        confirmLabel="Delete test"
        tone="danger"
        loading={deleteTest.isPending}
      />
    </div>
  )
}
