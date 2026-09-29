import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { ApiError } from '@/services/apiClient'
import { paths } from '@/routes/paths'
import { useParent } from '@/features/parents/api'
import { ParentOverviewTab } from '@/features/parents/components/admin/ParentOverviewTab'
import { ParentChildrenTab } from '@/features/parents/components/admin/ParentChildrenTab'
import type { ParentListItem } from '@/types/people'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'children', label: 'Linked students' },
] as const

type TabId = (typeof TABS)[number]['id']

/** One parent, one screen: the profile header and the two tabs behind it. */
export function ParentProfilePage() {
  const { id = '' } = useParams()
  const [tab, setTab] = useState<TabId>('overview')
  const parent = useParent(id)

  if (parent.isError) {
    return (
      <Alert tone="error" title="Could not load this parent">
        {parent.error instanceof ApiError ? parent.error.message : 'Please try again in a moment.'}
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to={paths.parents}
        className="text-ink-muted hover:text-primary inline-flex items-center gap-1.5 text-[13px]">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to parents
      </Link>

      {parent.data ? <ProfileHeader parent={parent.data} /> : <Skeleton className="h-32 rounded-xl" />}

      <div className="border-line flex [scrollbar-width:none] gap-1 overflow-x-auto border-b [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
              tab === item.id ? 'border-primary text-primary' : 'text-ink-muted hover:text-primary border-transparent',
            )}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? parent.data ? <ParentOverviewTab parent={parent.data} /> : <TabSkeleton /> : null}

      {tab === 'children' ? parent.data ? <ParentChildrenTab parent={parent.data} /> : <TabSkeleton /> : null}
    </div>
  )
}

function ProfileHeader({ parent }: { parent: ParentListItem }) {
  const fullName = `${parent.firstName} ${parent.lastName}`
  const childCount = parent.children.length

  return (
    <section className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={fullName} />

          <div className="min-w-0">
            <h1 className="font-display text-ink text-[22px] font-semibold tracking-[-0.03em]">{fullName}</h1>
            <p className="text-ink-muted mt-0.5 text-[13px]">
              {parent.occupation ?? 'Guardian'} · {childCount} linked {childCount === 1 ? 'student' : 'students'}
            </p>

            <div className="text-ink-muted mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
              {parent.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  {parent.phone}
                </span>
              ) : null}
              {parent.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  {parent.email}
                </span>
              ) : null}
              {parent.address ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  {parent.address}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <StatusBadge status={parent.status} />
      </div>
    </section>
  )
}

function TabSkeleton() {
  return <Skeleton className="h-64 rounded-xl" />
}
