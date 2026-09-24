import { useState } from 'react'
import { CalendarDays, Settings2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useCurrentUser } from '@/store/auth'
import { useClassOptions } from '@/features/classes/api'
import { useClassTimetable, useDeletePeriodRow } from '@/features/timetable/api'
import { EditEntrySheet } from '@/features/timetable/components/EditEntrySheet'
import type { EditEntryTarget } from '@/features/timetable/components/EditEntrySheet'
import { ManagePeriodsSheet } from '@/features/timetable/components/ManagePeriodsSheet'
import { TimetableBoard } from '@/features/timetable/components/TimetableBoard'
import { TimetableStats } from '@/features/timetable/components/TimetableStats'
import type { TimetablePeriodRow, Weekday } from '@/types/timetable'

export function TimetablePage() {
  const { toast } = useToast()
  const user = useCurrentUser()
  // The contract scopes timetable writes to the admin role; teachers and families read the week.
  const canManage = user?.role === 'ADMIN'

  const classOptions = useClassOptions()
  const [selectedClassId, setSelectedClassId] = useState('')
  const classList = classOptions.data ?? []
  const classId = selectedClassId || classList[0]?.id || ''

  const timetable = useClassTimetable(classId)
  const deletePeriodRow = useDeletePeriodRow(classId)

  const [target, setTarget] = useState<EditEntryTarget | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [periodsOpen, setPeriodsOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<TimetablePeriodRow | null>(null)

  const data = timetable.data
  const hasRows = (data?.periods.length ?? 0) > 0

  function selectClass(value: string) {
    setSelectedClassId(value)
    // A different class means a different week — close anything open on the old one.
    setEditOpen(false)
    setPeriodsOpen(false)
  }

  function openEntry(day: Weekday, orderIndex: number, label: string) {
    const slot = data?.days.find((item) => item.day === day)?.slots[orderIndex]
    if (!slot) return

    setTarget({ day, orderIndex, label, slot })
    setEditOpen(true)
  }

  async function confirmRemove() {
    if (!pendingRemove) return

    try {
      await deletePeriodRow.mutateAsync(pendingRemove.orderIndex)
      toast({
        tone: 'success',
        title: `${pendingRemove.label} removed`,
        description: 'It left every day of the week.',
      })
      setPendingRemove(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove this row',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  const managePeriodsButton = (
    <Button variant="secondary" className="shrink-0" onClick={() => setPeriodsOpen(true)} disabled={!data}>
      <Settings2 className="size-4" strokeWidth={1.75} />
      Manage periods
    </Button>
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Weekly timetable</h1>
          <p className="text-ink-muted text-[14px]">View and manage class schedules.</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Select
            className="max-w-45 min-w-0"
            options={classList.map((option) => ({ value: option.id, label: option.label }))}
            value={classId}
            onValueChange={selectClass}
            placeholder="Select a class…"
            aria-label="Select a class"
          />

          {canManage ? managePeriodsButton : null}
        </div>
      </header>

      <TimetableStats stats={data?.stats ?? null} />

      {timetable.isError ? (
        <Alert tone="error" title="Could not load the timetable">
          {timetable.error instanceof ApiError ? timetable.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      {timetable.isPending ? (
        <Skeleton className="h-130 rounded-xl" />
      ) : !data || !hasRows ? (
        <EmptyState
          icon={CalendarDays}
          title="No timetable yet"
          description={
            canManage
              ? 'Add the first period row and the week builds itself around it.'
              : 'This class has no timetable published yet.'
          }
          action={canManage ? managePeriodsButton : null}
        />
      ) : (
        <div className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card)">
          <TimetableBoard timetable={data} canManage={canManage} onEditSlot={openEntry} />
        </div>
      )}

      {/* Keyed on the cell, with the target kept on close, so the panel animates out. */}
      <EditEntrySheet
        key={target ? `${target.day}-${target.orderIndex}` : 'none'}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        classId={classId}
        target={target}
      />

      <ManagePeriodsSheet
        open={periodsOpen}
        onClose={() => setPeriodsOpen(false)}
        classId={classId}
        classLabel={data?.className ?? 'this class'}
        periods={data?.periods ?? []}
        onRequestRemove={setPendingRemove}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        onConfirm={confirmRemove}
        title="Remove this period row?"
        description={
          pendingRemove
            ? `${pendingRemove.label} (${pendingRemove.startTime} – ${pendingRemove.endTime}) is removed from every day of the week, and the lessons in that slot are cleared with it.`
            : undefined
        }
        confirmLabel="Remove row"
        tone="danger"
        loading={deletePeriodRow.isPending}
      />
    </div>
  )
}
