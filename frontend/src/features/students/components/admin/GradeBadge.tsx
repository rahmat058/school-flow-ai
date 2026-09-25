import { cn } from '@/lib/cn'

/** Grades are not statuses, so they get their own tone map rather than the status badge's. */
function gradeTone(grade: string): string {
  if (grade.startsWith('A')) return 'bg-success-soft text-success'
  if (grade.startsWith('F') || grade.startsWith('D')) return 'bg-error-soft text-error'
  return 'bg-primary-soft text-primary'
}

export function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium',
        gradeTone(grade),
      )}>
      {grade}
    </span>
  )
}
