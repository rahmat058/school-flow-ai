import { ProgressView } from '@/features/progress/components/student/ProgressView'

/**
 * A student's own progress — the trend, the subject comparison and the teacher remarks. STUDENT-only
 * at the route level, so the page needs no role branching.
 */
export function ProgressPage() {
  return <ProgressView />
}
