import { useState } from 'react'
import { ChevronDown, School } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { ApiError } from '@/services/apiClient'
import { useAssignmentSummary, useRemoveAssignedSubject } from '@/features/subjects/api'
import { SubjectChip } from '@/features/subjects/components/admin/SubjectChip'

/** One class at a time: what it runs, with a chip removable in place. The grid is its own tab. */
export function SummaryTab() {
  const { toast } = useToast()
  const summary = useAssignmentSummary()
  const removeSubject = useRemoveAssignedSubject()
  const [expanded, setExpanded] = useState<string[]>([])

  const data = summary.data

  async function remove(classId: string, subjectId: string, className: string) {
    try {
      await removeSubject.mutateAsync({ classId, subjectId })
      toast({ tone: 'success', title: `Subject removed from ${className}` })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove that subject',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  if (summary.isError) {
    return (
      <Alert tone="error" title="Could not load the assignment summary">
        {summary.error instanceof ApiError ? summary.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (summary.isPending || !data) {
    return <Skeleton className="h-80 rounded-xl" aria-busy="true" />
  }

  const subjectById = new Map(data.subjects.map((subject) => [subject.id, subject]))

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">
        Per-Class Assignment Overview
      </h2>
      <p className="text-ink-muted mt-1 text-[13px]">Expand a class to view or remove its assigned subjects.</p>

      <ul className="divide-line mt-4 divide-y">
        {data.classes.map((classRoom) => {
          const subjectIds = data.assigned[classRoom.id] ?? []
          const isOpen = expanded.includes(classRoom.id)

          return (
            <li key={classRoom.id}>
              <div className="flex items-center gap-3 py-3">
                <span className="bg-canvas text-ink-subtle inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <School className="size-4" strokeWidth={1.75} />
                </span>

                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setExpanded((current) =>
                      current.includes(classRoom.id)
                        ? current.filter((id) => id !== classRoom.id)
                        : [...current, classRoom.id],
                    )
                  }
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-ink text-[14px] font-semibold">{classRoom.label}</span>

                  <span className="flex shrink-0 items-center gap-3">
                    <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                      {subjectIds.length} subjects
                    </span>
                    <ChevronDown
                      className={cn('text-ink-subtle size-4 transition-transform', isOpen && 'rotate-180')}
                      strokeWidth={1.75}
                    />
                  </span>
                </button>
              </div>

              {isOpen ? (
                <div className="flex flex-wrap gap-2 pb-4">
                  {subjectIds.length === 0 ? (
                    <p className="text-ink-subtle text-[13px]">No subjects assigned yet.</p>
                  ) : (
                    subjectIds.map((subjectId) => {
                      const subject = subjectById.get(subjectId)
                      if (!subject) return null

                      return (
                        <SubjectChip
                          key={subjectId}
                          subject={subject}
                          removing={removeSubject.isPending}
                          onRemove={() => remove(classRoom.id, subjectId, classRoom.label)}
                        />
                      )
                    })
                  )}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </article>
  )
}
