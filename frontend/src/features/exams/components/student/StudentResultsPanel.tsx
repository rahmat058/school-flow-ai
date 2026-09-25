import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/apiClient'
import { useStudentExams } from '@/features/exams/api'
import { StudentResultsTab } from '@/features/exams/components/student/StudentResultsTab'

/** The student's own published marks — the My Reports page's results tab. Reuses the exams tab. */
export function StudentResultsPanel() {
  const exams = useStudentExams()

  if (exams.isError) {
    return (
      <Alert tone="error" title="Could not load your results">
        {exams.error instanceof ApiError ? exams.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (exams.isPending || !exams.data) {
    return (
      <div className="space-y-5" aria-busy="true">
        <Skeleton className="h-[76px] rounded-xl" />
        <Skeleton className="h-[280px] rounded-xl" />
      </div>
    )
  }

  return (
    <StudentResultsTab
      results={exams.data.results}
      summary={exams.data.summary}
      performance={exams.data.subjectPerformance}
    />
  )
}
