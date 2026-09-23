import { useEffect, useState } from 'react'
import { Megaphone, Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useNotices } from '@/features/notices/api'
import { formatDate, humanizeEnum } from '@/lib/format'
import { ApiError } from '@/services/apiClient'

const PAGE_SIZE = 5

export function NoticesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [search])

  const notices = useNotices({ page, limit: PAGE_SIZE, search: debouncedSearch })

  const total = notices.data?.meta.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const items = notices.data?.items ?? []

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Notices</h1>
        <p className="text-ink-muted text-[14px]">Announcements for every role. Drafts are visible to staff only.</p>
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
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[132px] rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices found" description="Nothing matches that search yet." />
      ) : (
        <div className="space-y-4">
          {items.map((notice) => (
            <Card key={notice.id}>
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {notice.publishedAt ? (
                    <span className="text-ink-subtle text-[12px]">
                      {formatDate(notice.publishedAt, 'dd MMM yyyy, HH:mm')}
                    </span>
                  ) : (
                    <span className="bg-warning-soft text-warning inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase">
                      Draft
                    </span>
                  )}
                  {notice.audience.map((audience) => (
                    <span
                      key={audience}
                      className="bg-canvas text-ink-muted inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase">
                      {humanizeEnum(audience)}
                    </span>
                  ))}
                </div>

                <div>
                  <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">{notice.title}</h2>
                  <p className="text-ink-muted mt-2 text-[14px] leading-relaxed">{notice.body}</p>
                </div>

                <p className="text-ink-subtle text-[12px]">
                  Posted by {notice.authorName}
                  {notice.classIds.length > 0 ? ` · ${notice.classIds.length} class targeted` : ''}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} className="justify-end" />
    </div>
  )
}
