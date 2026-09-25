import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/apiClient'
import { useMyAttendance } from '@/features/attendance/api'
import { AttendanceMonthView } from '@/features/attendance/components/AttendanceMonthView'

/** A student's own register, or a guardian's child's — one month at a time. */
export function MyAttendancePanel() {
  const [month, setMonth] = useState('')
  const [studentId, setStudentId] = useState('')
  const attendance = useMyAttendance({ month, studentId })
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

  // Only a guardian with more than one child has anything to switch between.
  const picker =
    data.students.length > 1 ? (
      <Select
        className="w-64"
        options={data.students.map((student) => ({
          value: student.id,
          label: student.meta ? `${student.label} · ${student.meta}` : student.label,
        }))}
        value={studentId || data.students[0].id}
        onValueChange={(value) => {
          setStudentId(value)
          // The new child may have registers in different months than the one on screen.
          setMonth('')
        }}
      />
    ) : null

  return (
    <AttendanceMonthView
      data={data}
      title="My Attendance"
      description="Your attendance record for this academic year."
      subjectPicker={picker}
      onMonthChange={setMonth}
    />
  )
}
