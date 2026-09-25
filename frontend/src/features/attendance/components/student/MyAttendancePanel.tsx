import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/apiClient'
import { useMyAttendance } from '@/features/attendance/api'
import { AttendanceMonthView } from '@/features/attendance/components/common/AttendanceMonthView'

/** A student's own register — one month at a time, with the calendar of how each day was marked. */
export function MyAttendancePanel() {
  const [month, setMonth] = useState('')
  const attendance = useMyAttendance({ month })
  const data = attendance.data

  if (attendance.isError) {
    return (
      <Alert tone="error" title="Could not load your attendance">
        {attendance.error instanceof ApiError ? attendance.error.message : 'Please try again.'}
      </Alert>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-11 rounded-lg" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <AttendanceMonthView
      data={data}
      title="My Attendance"
      description="Your attendance record for this academic year."
      onMonthChange={setMonth}
    />
  )
}
