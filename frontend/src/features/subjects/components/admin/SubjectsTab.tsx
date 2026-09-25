import { useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useDeleteSubject, useSubjectRows } from '@/features/subjects/api'
import { SubjectFormSheet } from '@/features/subjects/components/admin/SubjectFormSheet'
import type { SubjectRow } from '@/types/academic'

export function SubjectsTab() {
  const { toast } = useToast()
  const rows = useSubjectRows()
  const deleteSubject = useDeleteSubject()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SubjectRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SubjectRow | null>(null)

  const subjects = rows.data ?? []

  const columns: Array<DataTableColumn<SubjectRow>> = [
    {
      id: 'name',
      header: 'Subject Name',
      sortValue: (row) => row.name,
      cell: (row) => (
        <div>
          <p className="text-ink text-[14px] font-medium">{row.name}</p>
          <p className="text-ink-subtle text-[12px]">
            {row.classCount === 0 ? 'Not assigned to any class' : `In ${row.classCount} classes`}
          </p>
        </div>
      ),
    },
    {
      id: 'code',
      header: 'Code',
      align: 'center',
      cell: (row) => (
        <span className="bg-primary-soft text-primary inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase">
          {row.code}
        </span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => <span className="text-ink-muted text-[13px]">{row.description ?? '—'}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      className: 'w-16',
      cell: (row) => (
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
      ),
    },
  ]

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteSubject.mutateAsync(pendingDelete.id)
      toast({
        tone: 'success',
        title: `${pendingDelete.name} removed`,
        description:
          pendingDelete.classCount > 0
            ? `It is no longer taught in ${pendingDelete.classCount} classes.`
            : 'It was not assigned to any class.',
      })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove this subject',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Subjects</h2>
          <p className="text-ink-muted mt-1 text-[13px]">
            {rows.isPending ? 'Loading the catalogue…' : `${subjects.length} subject(s)`}
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add Subject
        </Button>
      </div>

      {rows.isError ? (
        <Alert tone="error" title="Could not load the subject catalogue">
          {rows.error instanceof ApiError ? rows.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <DataTable
        data={subjects}
        columns={columns}
        getRowId={(row) => row.id}
        loading={rows.isPending}
        emptyTitle="No subjects in the catalogue"
        emptyDescription="Add the first subject, then assign it to a class."
      />

      {/* Keyed on the target so the form remounts with that subject's values. */}
      <SubjectFormSheet
        key={editing?.id ?? 'new'}
        open={formOpen}
        subject={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this subject?"
        description={
          pendingDelete
            ? `${pendingDelete.name} leaves the catalogue and every class it is assigned to. A subject still used by lessons or exams cannot be removed.`
            : undefined
        }
        confirmLabel="Delete subject"
        tone="danger"
        loading={deleteSubject.isPending}
      />
    </div>
  )
}
