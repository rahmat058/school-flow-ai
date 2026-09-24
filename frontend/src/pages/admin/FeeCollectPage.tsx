import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { StudentCollectPanel } from '@/features/fees/components/StudentCollectPanel'
import { paths } from '@/routes/paths'

/** One student's collect view — reached from any Collect action, and back out to the module. */
export function FeeCollectPage() {
  const { studentId = '' } = useParams()

  return (
    <div className="space-y-6">
      <Link
        to={paths.fees}
        className="text-ink-muted hover:text-primary inline-flex items-center gap-2 text-[13px] font-medium transition-colors">
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Back to fee management
      </Link>

      <StudentCollectPanel studentId={studentId} />
    </div>
  )
}
