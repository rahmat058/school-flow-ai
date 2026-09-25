import { useEffect, useState } from 'react'
import { GraduationCap, Mail, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useDeleteTeacher, useTeachers } from '@/features/teachers/api'
import { TeacherFormSheet } from '@/features/teachers/components/admin/TeacherFormSheet'
import type { TeacherListItem } from '@/types/people'

/** Teachers as cards rather than a table: each one is a small profile, not a row of data. */
export function TeachersPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherListItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TeacherListItem | null>(null)

  // Debounced so typing does not fire a request per keystroke (setState happens in the timer cb).
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)

    return () => window.clearTimeout(timer)
  }, [search])

  const teachers = useTeachers({ search: debouncedSearch })
  const deleteTeacher = useDeleteTeacher()
  const rows = teachers.data ?? []

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(teacher: TeacherListItem) {
    setEditing(teacher)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteTeacher.mutateAsync(pendingDelete.id)
      toast({
        tone: 'success',
        title: `${pendingDelete.firstName} ${pendingDelete.lastName} left the staff list`,
        description: 'Their record is kept, but they no longer appear here.',
      })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove this teacher',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Teachers</h1>
          <p className="text-ink-muted text-[14px]">
            {teachers.isPending
              ? 'Loading the staff list…'
              : `${rows.length} teaching ${rows.length === 1 ? 'staff member' : 'staff members'}.`}
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add teacher
        </Button>
      </header>

      {teachers.isError ? (
        <Alert tone="error" title="Could not load teachers">
          {teachers.error instanceof ApiError ? teachers.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <div className="w-full max-w-xs">
        <Input
          icon={Search}
          type="search"
          placeholder="Search teachers…"
          aria-label="Search teachers"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {teachers.isPending ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </section>
      ) : rows.length === 0 ? (
        <section className="border-line bg-surface flex flex-col items-center rounded-xl border px-6 py-14 text-center shadow-[var(--shadow-card)]">
          <span className="bg-primary-soft text-primary inline-flex size-12 items-center justify-center rounded-full">
            <GraduationCap className="size-5" strokeWidth={1.75} />
          </span>
          <p className="text-ink mt-4 text-[15px] font-medium">No teachers found</p>
          <p className="text-ink-muted mt-1 max-w-sm text-[13px]">Try a different name or clear the search.</p>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((teacher) => (
            <article
              key={teacher.id}
              className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={`${teacher.firstName} ${teacher.lastName}`} />
                  <div className="min-w-0">
                    <p className="text-ink truncate text-[15px] font-medium">
                      {teacher.firstName} {teacher.lastName}
                    </p>
                    <p className="text-ink-subtle font-mono text-[12px]">{teacher.employeeNo}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(teacher)}
                    aria-label={`Edit ${teacher.firstName} ${teacher.lastName}`}
                    title="Edit"
                    className="text-ink-muted hover:bg-primary-soft hover:text-primary inline-flex size-8 items-center justify-center rounded-md transition-colors">
                    <Pencil className="size-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(teacher)}
                    aria-label={`Remove ${teacher.firstName} ${teacher.lastName}`}
                    title="Remove"
                    className="text-ink-muted hover:bg-error-soft hover:text-error inline-flex size-8 items-center justify-center rounded-md transition-colors">
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {teacher.subject ? (
                  <span className="bg-primary-soft text-primary rounded-full px-2.5 py-1 text-[11px] font-medium">
                    {teacher.subject}
                  </span>
                ) : null}
                {teacher.classLabels.map((label) => (
                  <span key={label} className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-[11px]">
                    {label}
                  </span>
                ))}
              </div>

              <dl className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  <dd className="text-ink-muted min-w-0 truncate text-[12.5px]">{teacher.email || '—'}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  <dd className="text-ink-muted text-[12.5px]">{teacher.phone ?? '—'}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="text-ink-subtle mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                  <dd className="text-ink-muted text-[12.5px]">
                    {teacher.qualification ?? '—'}
                    {teacher.experienceYears !== null ? ` · ${teacher.experienceYears} yrs` : ''}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      )}

      {/* Keyed on the target so the form remounts with that teacher's values. */}
      <TeacherFormSheet
        key={editing?.id ?? 'new'}
        open={formOpen}
        teacher={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Remove this teacher?"
        description={
          pendingDelete
            ? `${pendingDelete.firstName} ${pendingDelete.lastName} leaves the staff list. Their record and history stay on file.`
            : undefined
        }
        confirmLabel="Remove teacher"
        tone="danger"
        loading={deleteTeacher.isPending}
      />
    </div>
  )
}
