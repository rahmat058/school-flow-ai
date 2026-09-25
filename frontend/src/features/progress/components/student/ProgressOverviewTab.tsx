import { PerformanceTrendChart } from '@/features/progress/components/student/PerformanceTrendChart'
import { SubjectRadarChart } from '@/features/progress/components/student/SubjectRadarChart'
import type { ProgressSubjectRow, ProgressTrendPoint } from '@/types/progress'

interface ProgressOverviewTabProps {
  trend: ProgressTrendPoint[]
  subjects: ProgressSubjectRow[]
}

/** The Overview tab: how the marks have moved over time, and how each subject sits in the class. */
export function ProgressOverviewTab({ trend, subjects }: ProgressOverviewTabProps) {
  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12 xl:col-span-7">
        <PerformanceTrendChart trend={trend} />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <SubjectRadarChart subjects={subjects} />
      </div>
    </div>
  )
}
