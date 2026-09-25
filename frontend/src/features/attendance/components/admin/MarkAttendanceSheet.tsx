import { useState } from 'react'
import { CalendarCheck, Check } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { attendanceStatusOptions } from '@/lib/options'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useDailyRegister, useMarkAttendance } from '@/features/attendance/api'
import type { AttendanceStatus } from '@/types/attendance'

interface MarkAttendanceSheetProps {
  open: boolean
  onClose: () => void
  classId: string
  /** The class label, for the sheet's description. */
  classLabel: string
}

/**
 * The register marking sheet — one day for one class. The day opens from what is stored, and a student
 * with no stored status defaults to `PRESENT` (a register is marked by exception), so Save always has a
 * value for every row. The caller keys this on the class, so the draft resets when the class changes.
 */
export function MarkAttendanceSheet({ open, onClose, classId, classLabel }: MarkAttendanceSheetProps) {
  const { toast } = useToast()
  const [date, setDate] = useState('')
  // Only the touched rows live in the draft; an untouched row reads through to what the API stored.
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})
  const register = useDailyRegister({ classId, date })
  const markAttendance = useMarkAttendance()
  const data = register.data

  const statusOf = (studentId: string, stored: AttendanceStatus | null): AttendanceStatus =>
    draft[studentId] ?? stored ?? 'PRESENT'

  async function handleSave() {
    if (!data) return

    try {
      await markAttendance.mutateAsync({
        classId,
        // The resolved day, not the local draft — the API may have answered for a different date.
        date: data.date,
        records: data.rows.map((row) => ({
          studentId: row.studentId,
          status: statusOf(row.studentId, row.status),
          note: row.note,
        })),
      })
      toast({
        tone: 'success',
        title: 'Register saved',
        description: `${data.classLabel} · ${formatDate(data.date, 'dd MMM yyyy')}`,
      })
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not save the register',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Mark attendance"
      description={`Class ${classLabel}${data ? ` · ${data.rows.length} student${data.rows.length === 1 ? '' : 's'}` : ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={markAttendance.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={markAttendance.isPending || !data || data.rows.length === 0}>
            {markAttendance.isPending ? (
              <Spinner size="sm" className="text-white" label="Saving" />
            ) : (
              <Check className="size-4" strokeWidth={2} />
            )}
            Save register
          </Button>
        </>
      }>
      {register.isError ? (
        <Alert tone="error" title="Could not open the register">
          {register.error instanceof ApiError ? register.error.message : 'Please try again.'}
        </Alert>
      ) : !data ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-[42px] rounded-md" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : (
        <div className="space-y-5">
          <Input
            type="date"
            label="Date"
            value={date || data.date}
            hint="Pick another day to mark it or correct it."
            onChange={(event) => {
              // A new day is a new register — drop the draft rather than carry a status across.
              setDate(event.target.value)
              setDraft({})
            }}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-ink-muted text-[13px]">
              {formatDate(data.date, 'EEE, dd MMM yyyy')}
              {data.isMarked ? ' · already marked' : ' · not marked yet'}
            </p>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setDraft((current) => {
                  const next = { ...current }
                  for (const row of data.rows) next[row.studentId] = 'PRESENT'
                  return next
                })
              }>
              <CalendarCheck className="size-4" strokeWidth={1.75} />
              All present
            </Button>
          </div>

          {data.rows.length === 0 ? (
            <p className="text-ink-subtle text-[13px]">This class has no active students.</p>
          ) : (
            <ul className="divide-line divide-y">
              {data.rows.map((row) => (
                <li key={row.studentId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-[13px] font-medium">{row.name}</p>
                    <p className="text-ink-subtle text-[12px] tabular-nums">
                      {row.admissionNo} · Roll {row.rollNo}
                    </p>
                  </div>

                  <StatusPicker
                    value={statusOf(row.studentId, row.status)}
                    onChange={(status) => setDraft((current) => ({ ...current, [row.studentId]: status }))}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  )
}

/** The four-way status control — the reference's button group, the same treatment as the pay form's. */
function StatusPicker({ value, onChange }: { value: AttendanceStatus; onChange: (status: AttendanceStatus) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Attendance status">
      {attendanceStatusOptions.map((option) => {
        const selected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value as AttendanceStatus)}
            className={cn(
              'rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors',
              selected
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-line text-ink-muted hover:bg-primary-soft hover:text-primary',
            )}>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
