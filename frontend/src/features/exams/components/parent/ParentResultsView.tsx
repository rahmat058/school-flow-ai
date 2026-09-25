import { useState } from 'react'
import { CheckCircle2, ClipboardList, TrendingUp } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatCard } from '@/features/dashboard/common/StatCard'
import { ApiError } from '@/services/apiClient'
import { useStudentExams } from '@/features/exams/api'
import { ExamResultsList } from '@/features/exams/components/parent/ExamResultsList'
import { SubjectPerformanceChart } from '@/features/exams/components/parent/SubjectPerformanceChart'
import type { StatMetric } from '@/types/dashboard'

/**
 * A guardian's view of one child's published marks — the same `GET /exams/me` read a student's own
 * Tests & exams screen uses, so a parent and their child are never shown different numbers. Only the
 * presentation differs: the child is named in the header, and the three cards answer a guardian's
 * questions rather than a student's.
 */
export function ParentResultsView() {
  const [studentId, setStudentId] = useState('')
  const exams = useStudentExams(studentId)
  const data = exams.data

  if (exams.isError) {
    return (
      <Alert tone="error" title="Could not load your child's results">
        {exams.error instanceof ApiError ? exams.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const total = data.summary.passed + data.summary.failed
  const stats: StatMetric[] = [
    {
      id: 'average-score',
      label: 'Average Score',
      value: `${data.summary.averageScore}%`,
      delta: `Across ${data.counts.results} ${data.counts.results === 1 ? 'paper' : 'papers'}`,
      icon: TrendingUp,
      iconTone: 'success',
    },
    {
      id: 'passed',
      label: 'Passed',
      value: `${data.summary.passed}/${total}`,
      delta: 'Papers cleared',
      icon: CheckCircle2,
      iconTone: 'primary',
    },
    {
      id: 'total-papers',
      label: 'Total Papers',
      value: String(data.counts.results),
      delta: 'Appeared',
      icon: ClipboardList,
      iconTone: 'primary',
    },
  ]

  // Only a guardian with more than one child has anything to switch between.
  const picker =
    data.students.length > 1 ? (
      <Select
        className="max-w-72"
        options={data.students.map((student) => ({
          value: student.id,
          label: student.meta ? `${student.label} · ${student.meta}` : student.label,
        }))}
        value={studentId || data.students[0].id}
        onValueChange={setStudentId}
        aria-label="Choose a child"
      />
    ) : null

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">
            Results &amp; Report Card
          </h1>
          <p className="text-ink-muted text-[14px]">View all exam results for your child.</p>
        </div>

        <div className="border-line bg-surface flex items-center gap-3 rounded-xl border px-3 py-2 shadow-(--shadow-card)">
          <Avatar name={data.subjectLabel} size="md" />
          <div className="min-w-0">
            <p className="text-ink truncate text-[13px] font-semibold">{data.subjectLabel}</p>
            {data.subjectMeta ? <p className="text-ink-muted text-[12px]">Class {data.subjectMeta}</p> : null}
          </div>
        </div>
      </header>

      {picker}

      <section className="grid gap-5 sm:grid-cols-3">
        {stats.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </section>

      <SubjectPerformanceChart subjects={data.subjectPerformance} />

      <ExamResultsList results={data.results} />
    </div>
  )
}
