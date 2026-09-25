import { Check } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/apiClient'
import { useAssignmentSummary } from '@/features/subjects/api'

/**
 * The whole assignment grid in one frame: rows are classes, columns are subjects, a tick means the
 * class teaches it. A tab of its own rather than the foot of the Summary tab, because it is the one
 * view that answers "who teaches what" at a glance and it scrolled out of sight down there.
 */
export function MatrixTab() {
  const summary = useAssignmentSummary()
  const data = summary.data

  if (summary.isError) {
    return (
      <Alert tone="error" title="Could not load the assignment matrix">
        {summary.error instanceof ApiError ? summary.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (summary.isPending || !data) {
    return <Skeleton className="h-96 rounded-xl" />
  }

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Assignment Matrix</h2>
      <p className="text-ink-muted mt-1 text-[13px]">Rows = classes · Columns = subjects · ✓ = assigned</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left">
          <thead>
            <tr className="bg-canvas">
              <th scope="col" className="bg-canvas text-ink-muted sticky left-0 z-10 px-3 py-2 text-[12px] font-medium">
                Class
              </th>
              {data.subjects.map((subject) => (
                <th key={subject.id} scope="col" className="px-3 py-2 text-center align-bottom whitespace-nowrap">
                  <span className="text-ink-muted block text-[12px] font-medium">{subject.name}</span>
                  <span className="text-ink-subtle block text-[10px] font-semibold tracking-[0.06em]">
                    {subject.code}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-line divide-y">
            {data.classes.map((classRoom) => {
              const assignedIds = new Set(data.assigned[classRoom.id] ?? [])

              return (
                <tr key={classRoom.id}>
                  <th
                    scope="row"
                    className="bg-surface text-ink sticky left-0 z-10 px-3 py-2 text-left text-[13px] font-medium whitespace-nowrap">
                    {classRoom.label}
                  </th>

                  {data.subjects.map((subject) => (
                    <td key={subject.id} className="px-3 py-2 text-center">
                      {assignedIds.has(subject.id) ? (
                        <span
                          className="bg-primary-soft text-primary inline-flex size-5 items-center justify-center rounded-full"
                          aria-label={`${subject.name} assigned`}>
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="text-ink-subtle" aria-hidden="true">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}
