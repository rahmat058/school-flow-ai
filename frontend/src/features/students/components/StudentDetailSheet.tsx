import { Mail, MapPin, Phone } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Sheet } from '@/components/ui/Sheet'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import type { StudentListItem } from '@/types/people'

interface StudentDetailSheetProps {
  open: boolean
  onClose: () => void
  student: StudentListItem | null
  onEdit: () => void
}

const ATTENDANCE_THRESHOLD = 75

/** Read-only view of a roster row, with the guardian contact the form collects. */
export function StudentDetailSheet({ open, onClose, student, onEdit }: StudentDetailSheetProps) {
  if (!student) return null

  const fullName = `${student.firstName} ${student.lastName}`

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Student profile"
      description={`${student.className} · roll ${student.rollNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit student</Button>
        </>
      }>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Avatar name={fullName} />
          <div className="min-w-0">
            <p className="text-ink truncate text-[16px] font-medium">{fullName}</p>
            <p className="text-ink-subtle font-mono text-[12px]">{student.admissionNo}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <Detail label="Class" value={student.className} />
          <Detail label="Roll no." value={String(student.rollNo)} />
          <Detail label="Date of birth" value={student.dateOfBirth ? formatDate(student.dateOfBirth) : '—'} />
          <Detail label="Gender" value={student.gender ? student.gender.toLowerCase() : '—'} />
        </dl>

        <div className="border-line border-t pt-5">
          <p className="text-ink-muted text-[13px]">Attendance</p>
          <div className="mt-2 flex items-center gap-2.5">
            <Progress
              value={student.attendancePercentage}
              tone={student.attendancePercentage < ATTENDANCE_THRESHOLD ? 'error' : 'primary'}
              className="w-24"
            />
            <span className="text-ink text-[13px] tabular-nums">{student.attendancePercentage}%</span>
          </div>
        </div>

        <div className="border-line border-t pt-5">
          <p className="text-ink-muted text-[13px]">Fees</p>
          <div className="mt-2">
            <StatusBadge status={student.feeStanding} />
          </div>
        </div>

        <div className="border-line border-t pt-5">
          <p className="text-ink text-[14px] font-medium">Guardian</p>

          {student.guardian ? (
            <div className="mt-3 space-y-2.5">
              <p className="text-ink text-[13px] font-medium">{student.guardian.name}</p>

              {student.guardian.phone ? (
                <p className="text-ink-muted flex items-center gap-2 text-[13px]">
                  <Phone className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  {student.guardian.phone}
                </p>
              ) : null}

              {student.guardian.email ? (
                <p className="text-ink-muted flex items-center gap-2 text-[13px]">
                  <Mail className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{student.guardian.email}</span>
                </p>
              ) : null}

              {student.guardian.address ? (
                <p className="text-ink-muted flex items-start gap-2 text-[13px]">
                  <MapPin className="text-ink-subtle mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                  {student.guardian.address}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-ink-subtle mt-2 text-[13px]">No guardian on record.</p>
          )}
        </div>
      </div>
    </Sheet>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-muted text-[13px]">{label}</dt>
      <dd className="text-ink mt-0.5 text-[14px]">{value}</dd>
    </div>
  )
}
