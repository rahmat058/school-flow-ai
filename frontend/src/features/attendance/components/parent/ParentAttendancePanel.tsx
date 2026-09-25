import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/apiClient'
import { useMyAttendance } from '@/features/attendance/api'
import { AttendanceMonthView } from '@/features/attendance/components/common/AttendanceMonthView'

/**
 * A guardian's view of one child's register — the same month view a student reads, with the child
 * named in the header and a picker when there is more than one to switch between.
 */
export function ParentAttendancePanel() {
  const [month, setMonth] = useState('')
  const [studentId, setStudentId] = useState('')
  const attendance = useMyAttendance({ month, studentId })
  const data = attendance.data

  if (attendance.isError) {
    return (
      <Alert tone="error" title="Could not load your child's attendance">
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
        aria-label="Choose a child"
      />
    ) : null

  // Whose register this is, at a glance — the payload already resolves the child's name and class.
  const subjectChip = (
    <div className="border-line bg-surface flex items-center gap-3 rounded-xl border px-3 py-2 shadow-(--shadow-card)">
      <Avatar name={data.subjectLabel} size="md" />
      <div className="min-w-0">
        <p className="text-ink truncate text-[13px] font-semibold">{data.subjectLabel}</p>
        {data.subjectMeta ? <p className="text-ink-muted text-[12px]">Class {data.subjectMeta}</p> : null}
      </div>
    </div>
  )

  return (
    <AttendanceMonthView
      data={data}
      title="Attendance Record"
      description="Monthly attendance history for your child."
      subjectPicker={picker}
      subjectChip={subjectChip}
      onMonthChange={setMonth}
    />
  )
}
