import { useEffect, useState } from 'react'
import { Megaphone, Plus, Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useCurrentUser } from '@/store/auth'
import { useDeleteNotice, useNotices } from '@/features/notices/api'
import { NoticeCard } from '@/features/notices/components/admin/NoticeCard'
import { NoticeFormSheet } from '@/features/notices/components/admin/NoticeFormSheet'
import type { Notice } from '@/types/communication'

const PAGE_SIZE = 5

export function NoticesPage() {
  const { toast } = useToast()
  const user = useCurrentUser()
  // Reads are open to every role; publishing is the admin's, per the API contract.
  const canManage = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Notice | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Notice | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [search])

  const notices = useNotices({ page, limit: PAGE_SIZE, search: debouncedSearch })
  const deleteNotice = useDeleteNotice()

  const total = notices.data?.meta.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const items = notices.data?.items ?? []
  const hasSearch = debouncedSearch.length > 0

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(notice: Notice) {
    setEditing(notice)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteNotice.mutateAsync(pendingDelete.id)
      toast({
        tone: 'success',
        title: `${pendingDelete.title} removed`,
        description: 'It leaves the board but stays on record.',
      })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove this notice',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Notice board</h1>
          <p className="text-ink-muted text-[14px]">
            {notices.isPending ? 'Loading notices…' : `${total} announcement${total === 1 ? '' : 's'} posted.`}
          </p>
        </div>

        {canManage ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" strokeWidth={1.75} />
            New notice
          </Button>
        ) : null}
      </header>

      {notices.isError ? (
        <Alert tone="error" title="Could not load notices">
          {notices.error instanceof ApiError ? notices.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <div className="w-full max-w-sm">
        <Input
          icon={Search}
          type="search"
          placeholder="Search notices"
          aria-label="Search notices"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {notices.isPending ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[152px] rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No notices found"
          description={hasSearch ? 'Nothing matches that search yet.' : 'Nothing has been posted to the board yet.'}
          action={
            canManage && !hasSearch ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" strokeWidth={1.75} />
                New notice
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} className="justify-end" />

      {/* Keyed on the target so the form remounts with that notice's values. */}
      <NoticeFormSheet key={editing?.id ?? 'new'} open={formOpen} notice={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Remove this notice?"
        description={
          pendingDelete
            ? `${pendingDelete.title} leaves the notice board. The record is kept, so it can be traced later.`
            : undefined
        }
        confirmLabel="Remove notice"
        tone="danger"
        loading={deleteNotice.isPending}
      />
    </div>
  )
}
