import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { homeworkStatusOptions } from '@/lib/options'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useCurrentUser } from '@/store/auth'
import { useClassOptions } from '@/features/classes/api'
import { useDeleteHomework, useHomework } from '@/features/homework/api'
import { HomeworkCard } from '@/features/homework/components/admin/HomeworkCard'
import { HomeworkFormSheet } from '@/features/homework/components/admin/HomeworkFormSheet'
import type { HomeworkListItem, HomeworkStatus } from '@/types/homework'

export function HomeworkPage() {
  const { toast } = useToast()
  const user = useCurrentUser()
  // Everyone reads the list; only staff assign, edit or remove.
  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER'

  const classOptions = useClassOptions()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState<HomeworkStatus | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HomeworkListItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<HomeworkListItem | null>(null)

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)

    return () => window.clearTimeout(timer)
  }, [search])

  const assignments = useHomework({ search: debouncedSearch, classId, status })
  const deleteHomework = useDeleteHomework()
  const rows = assignments.data ?? []
  const hasFilters = Boolean(debouncedSearch || classId || status)

  const classSelectOptions = [
    { value: '', label: 'All classes' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(assignment: HomeworkListItem) {
    setEditing(assignment)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteHomework.mutateAsync(pendingDelete.id)
      toast({
        tone: 'success',
        title: `${pendingDelete.title} removed`,
        description: 'Submissions already received are kept.',
      })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove this assignment',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Homework</h1>
          <p className="text-ink-muted text-[14px]">
            {assignments.isPending
              ? 'Loading assignments…'
              : `${rows.length} assignment${rows.length === 1 ? '' : 's'}${hasFilters ? ' match' : ' total'}.`}
          </p>
        </div>

        {canManage ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" strokeWidth={1.75} />
            New assignment
          </Button>
        ) : null}
      </header>

      {assignments.isError ? (
        <Alert tone="error" title="Could not load homework">
          {assignments.error instanceof ApiError ? assignments.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            icon={Search}
            type="search"
            placeholder="Search by title or subject…"
            aria-label="Search assignments"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select
          className="max-w-45"
          options={classSelectOptions}
          value={classId}
          onValueChange={setClassId}
          aria-label="Filter by class"
        />

        <Select
          className="max-w-40"
          options={homeworkStatusOptions}
          value={status}
          onValueChange={(value) => setStatus(value as HomeworkStatus | '')}
          aria-label="Filter by status"
        />
      </div>

      {assignments.isPending ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-60 rounded-xl" />
          ))}
        </section>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments found"
          description={
            hasFilters
              ? 'Nothing matches those filters yet. Try another class or clear the search.'
              : 'No homework has been assigned yet.'
          }
          action={
            canManage && !hasFilters ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" strokeWidth={1.75} />
                New assignment
              </Button>
            ) : null
          }
        />
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((assignment) => (
            <HomeworkCard
              key={assignment.id}
              assignment={assignment}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={setPendingDelete}
            />
          ))}
        </section>
      )}

      {/* Keyed on the target so the form remounts with that assignment's values. */}
      <HomeworkFormSheet
        key={editing?.id ?? 'new'}
        open={formOpen}
        homework={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this assignment?"
        description={
          pendingDelete
            ? `${pendingDelete.title} leaves the homework list. Submissions already received stay on file.`
            : undefined
        }
        confirmLabel="Delete assignment"
        tone="danger"
        loading={deleteHomework.isPending}
      />
    </div>
  )
}
