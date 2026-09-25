import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/apiClient'
import { useClassAttendance } from '@/features/attendance/api'
import { AttendanceMonthView } from '@/features/attendance/components/common/AttendanceMonthView'
import { useClassOptions } from '@/features/classes/api'

/** The register for one class, month by month — the staff view. */
export function ClassAttendancePanel() {
  const classOptions = useClassOptions()
  const [classId, setClassId] = useState('')
  const [month, setMonth] = useState('')

  const options = classOptions.data ?? []
  // Open on the first class rather than an empty screen.
  const activeClassId = classId || options[0]?.id || ''
  const attendance = useClassAttendance({ classId: activeClassId, month })
  const data = attendance.data

  if (classOptions.isError || attendance.isError) {
    return (
      <Alert tone="error" title="Could not load the register">
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
      title="Class Attendance"
      description="The register for one class, month by month."
      subjectPicker={
        <Select
          className="w-64"
          options={options.map((option) => ({ value: option.id, label: `Class ${option.label}` }))}
          value={activeClassId}
          onValueChange={(value) => {
            setClassId(value)
            // Another class may not have a register in the month on screen.
            setMonth('')
          }}
        />
      }
      onMonthChange={setMonth}
    />
  )
}
