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
import {
  useStudentAttendance,
  useStudentDocuments,
  useStudentFees,
  useStudentProfile,
  useStudentResults,
} from '@/features/students/api'
import { StudentOverviewTab } from '@/features/students/components/StudentOverviewTab'
import { StudentAttendanceTab } from '@/features/students/components/StudentAttendanceTab'
import { StudentMarksTab } from '@/features/students/components/StudentMarksTab'
import { StudentResultsTab } from '@/features/students/components/StudentResultsTab'
import { StudentFeesTab } from '@/features/students/components/StudentFeesTab'
import { StudentDocumentsTab } from '@/features/students/components/StudentDocumentsTab'
import type { StudentProfile } from '@/types/people'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'marks', label: 'Marks' },
  { id: 'results', label: 'Results' },
  { id: 'fees', label: 'Fee history' },
  { id: 'documents', label: 'Documents' },
] as const

type TabId = (typeof TABS)[number]['id']

/** One student, one screen: the profile header and the six tabs behind it. */
export function StudentProfilePage() {
  const { id = '' } = useParams()
  const [tab, setTab] = useState<TabId>('overview')

  // One query per tab, so a slow panel never blocks the header.
  const profile = useStudentProfile(id)
  const attendance = useStudentAttendance(id)
  const results = useStudentResults(id)
  const fees = useStudentFees(id)
  const documents = useStudentDocuments(id)

  if (profile.isError) {
    return (
      <Alert tone="error" title="Could not load this student">
        {profile.error instanceof ApiError ? profile.error.message : 'Please try again in a moment.'}
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to={paths.students}
        className="text-ink-muted hover:text-primary inline-flex items-center gap-1.5 text-[13px]">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to students
      </Link>

      {profile.data ? <ProfileHeader profile={profile.data} /> : <Skeleton className="h-32 rounded-xl" />}

      <div className="border-line flex gap-1 overflow-x-auto border-b">
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

      {tab === 'overview' ? profile.data ? <StudentOverviewTab profile={profile.data} /> : <TabSkeleton /> : null}

      {tab === 'attendance' ? (
        attendance.data ? (
          <StudentAttendanceTab attendance={attendance.data} />
        ) : (
          <TabSkeleton />
        )
      ) : null}

      {tab === 'marks' ? results.data ? <StudentMarksTab rows={results.data.rows} /> : <TabSkeleton /> : null}

      {tab === 'results' ? results.data ? <StudentResultsTab results={results.data} /> : <TabSkeleton /> : null}

      {tab === 'fees' ? fees.data ? <StudentFeesTab fees={fees.data} /> : <TabSkeleton /> : null}

      {tab === 'documents' ? (
        documents.data ? (
          <StudentDocumentsTab documents={documents.data} />
        ) : (
          <TabSkeleton />
        )
      ) : null}
    </div>
  )
}

function ProfileHeader({ profile }: { profile: StudentProfile }) {
  const fullName = `${profile.firstName} ${profile.lastName}`

  return (
    <section className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={fullName} />

          <div className="min-w-0">
            <h1 className="font-display text-ink text-[22px] font-semibold tracking-[-0.03em]">{fullName}</h1>
            <p className="text-ink-muted mt-0.5 text-[13px]">
              Class {profile.className} · Roll {profile.rollNo}
            </p>

            <div className="text-ink-muted mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
              {profile.guardian ? <span className="text-ink-subtle">Guardian · {profile.guardian.name}</span> : null}
              {profile.guardian?.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  {profile.guardian.phone}
                </span>
              ) : null}
              {profile.guardian?.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  {profile.guardian.email}
                </span>
              ) : null}
              {profile.guardian?.address ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  {profile.guardian.address}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary-soft text-primary rounded-full px-3 py-1 text-[12px] font-medium">
            {profile.attendancePercentage}% attendance
          </span>
          <StatusBadge status={profile.feeStanding} />
        </div>
      </div>
    </section>
  )
}

function TabSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
