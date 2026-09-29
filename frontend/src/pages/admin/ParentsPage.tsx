import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, MoreHorizontal, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useDeleteParent, useParents } from '@/features/parents/api'
import { ParentFormSheet } from '@/features/parents/components/admin/ParentFormSheet'
import { parentProfilePath } from '@/routes/paths'
import type { ParentListItem } from '@/types/people'

const PAGE_SIZE = 10

export function ParentsPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ParentListItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ParentListItem | null>(null)

  // Debounced so typing does not fire a request per keystroke (setState happens in the timer cb).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [search])

  const parents = useParents({ page, limit: PAGE_SIZE, search: debouncedSearch })
  const deleteParent = useDeleteParent()

  const total = parents.data?.meta.totalItems ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(parent: ParentListItem) {
    setEditing(parent)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteParent.mutateAsync(pendingDelete.id)
      toast({
        tone: 'success',
        title: `${pendingDelete.firstName} ${pendingDelete.lastName} removed`,
        description: 'Their record and linked students stay on file.',
      })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove the parent',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  const columns: Array<DataTableColumn<ParentListItem>> = [
    {
      id: 'parent',
      header: 'Parent',
      sortValue: (row) => `${row.firstName} ${row.lastName}`,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.firstName} ${row.lastName}`} size="sm" />
          <div className="min-w-0">
            <p className="text-ink truncate text-[14px] font-medium">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-ink-subtle text-[12px]">{row.occupation ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      sortValue: (row) => row.email ?? '',
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink-muted truncate text-[13px]">{row.email ?? '—'}</p>
          <p className="text-ink-subtle text-[12px]">{row.phone ?? '—'}</p>
        </div>
      ),
    },
    {
      id: 'children',
      header: 'Children',
      sortValue: (row) => row.children.length,
      cell: (row) =>
        row.children.length === 0 ? (
          <span className="text-ink-subtle text-[13px]">None linked</span>
        ) : (
          <div className="min-w-0">
            <p className="text-ink-muted text-[13px]">
              {row.children.length} {row.children.length === 1 ? 'child' : 'children'}
            </p>
            <p className="text-ink-subtle truncate text-[12px]">{row.children.map((child) => child.name).join(', ')}</p>
          </div>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <Dropdown
            triggerLabel={`Actions for ${row.firstName} ${row.lastName}`}
            trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
            items={[
              { id: 'view', label: 'View', icon: Eye, onSelect: () => navigate(parentProfilePath(row.id)) },
              { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => openEdit(row) },
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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Parents</h1>
          <p className="text-ink-muted text-[14px]">
            {parents.isPending ? 'Loading the guardians…' : `${total} guardians on record.`}
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add parent
        </Button>
      </header>

      {parents.isError ? (
        <Alert tone="error" title="Could not load parents">
          {parents.error instanceof ApiError ? parents.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <div className="w-full max-w-xs">
        <Input
          icon={Search}
          type="search"
          placeholder="Search by name, email or child…"
          aria-label="Search parents"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <DataTable
        data={parents.data?.items ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={parents.isPending}
        pageSize={PAGE_SIZE}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
        emptyIcon={UserRound}
        emptyTitle="No parents found"
        emptyDescription="Try a different name or clear the search."
      />

      {/* Keyed on the target so the form remounts with that parent's values, never the last edit. */}
      <ParentFormSheet key={editing?.id ?? 'new'} open={formOpen} parent={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Remove this parent?"
        description={
          pendingDelete
            ? `${pendingDelete.firstName} ${pendingDelete.lastName} is removed from the list. Their record and linked students stay on file.`
            : undefined
        }
        confirmLabel="Remove parent"
        tone="danger"
        loading={deleteParent.isPending}
      />
    </div>
  )
}
