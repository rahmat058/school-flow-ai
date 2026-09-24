import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useDeleteExam, useExams } from '@/features/exams/api'
import { ExamFormSheet } from '@/features/exams/components/ExamFormSheet'
import { ExamTable } from '@/features/exams/components/ExamTable'
import type { ExamListItem } from '@/types/exams'

export function ExamsTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast()
  const classOptions = useClassOptions()
  const [classId, setClassId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ExamListItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ExamListItem | null>(null)

  const exams = useExams({ classId })
  const deleteExam = useDeleteExam()
  const rows = exams.data ?? []

  const classSelectOptions = [
    { value: '', label: 'All classes' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteExam.mutateAsync(pendingDelete.id)
      toast({ tone: 'success', title: `${pendingDelete.name} removed` })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove this exam',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          className="max-w-45"
          options={classSelectOptions}
          value={classId}
          onValueChange={setClassId}
          aria-label="Filter by class"
        />

        {canManage ? (
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}>
            <Plus className="size-4" strokeWidth={1.75} />
            New exam
          </Button>
        ) : null}
      </div>

      {exams.isError ? (
        <Alert tone="error" title="Could not load exams">
          {exams.error instanceof ApiError ? exams.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <ExamTable
        rows={rows}
        canManage={canManage}
        loading={exams.isPending}
        onEdit={(exam) => {
          setEditing(exam)
          setFormOpen(true)
        }}
        onDelete={setPendingDelete}
      />

      {/* Keyed on the target so the form remounts with that exam's subjects. */}
      <ExamFormSheet key={editing?.id ?? 'new'} open={formOpen} exam={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this exam?"
        description={
          pendingDelete
            ? `${pendingDelete.name} leaves the exams list, along with its subject schedule and any marks.`
            : undefined
        }
        confirmLabel="Delete exam"
        tone="danger"
        loading={deleteExam.isPending}
      />
    </div>
  )
}
