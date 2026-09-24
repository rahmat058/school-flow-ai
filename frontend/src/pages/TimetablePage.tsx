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
import { useClassTimetable, useDeletePeriodRow, useMyTimetable } from '@/features/timetable/api'
import { EditEntrySheet } from '@/features/timetable/components/EditEntrySheet'
import type { EditEntryTarget } from '@/features/timetable/components/EditEntrySheet'
import { ManagePeriodsSheet } from '@/features/timetable/components/ManagePeriodsSheet'
import { TimetableBoard } from '@/features/timetable/components/TimetableBoard'
import { TimetableStats } from '@/features/timetable/components/TimetableStats'
import { classGridOf, teacherGridOf } from '@/features/timetable/lib/grid'
import type { TimetablePeriodRow, Weekday } from '@/types/timetable'

/**
 * Only the admin picks a class and edits. A teacher reads their own lessons, a student their class's
 * week and a parent their child's — all resolved by `GET /timetables/me`, so the view never has to
 * work out which week it is allowed to see.
 */
export function TimetablePage() {
  const user = useCurrentUser()

  return user?.role === 'ADMIN' ? <AdminTimetable /> : <MyWeek />
}

/** The whole school's timetables, class by class, with the editor. */
function AdminTimetable() {
  const { toast } = useToast()
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
          <p className="text-ink-muted text-[14px]">Every class's week — pick one to view or edit it.</p>
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

          {managePeriodsButton}
        </div>
      </header>

      <TimetableStats input={data ? { scope: 'CLASS', stats: data.stats } : null} />

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
          description="Add the first period row and the week builds itself around it."
          action={managePeriodsButton}
        />
      ) : (
        <div className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card)">
          <TimetableBoard grid={classGridOf(data)} canManage onEditCell={openEntry} />
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

/** Everyone else: the caller's own week, read-only — and a guardian's children, one at a time. */
function MyWeek() {
  const [childId, setChildId] = useState('')
  const view = useMyTimetable(true, childId)
  const data = view.data
  const children = data?.scope === 'CLASS' ? data.children : []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">
            {data?.scope === 'TEACHER' ? 'My schedule' : 'Class timetable'}
          </h1>
          <p className="text-ink-muted text-[14px]">
            {data ? `${data.label} · ${data.note}` : 'Loading your timetable…'}
          </p>
        </div>

        {children.length > 1 ? (
          <Select
            className="w-60 shrink-0"
            aria-label="Choose a child"
            options={children.map((child) => ({
              value: child.studentId,
              label: `${child.name} · ${child.className}`,
            }))}
            value={childId || children[0].studentId}
            onValueChange={setChildId}
          />
        ) : null}
      </header>

      {view.isError ? (
        <Alert tone="error" title="Could not load your timetable">
          {view.error instanceof ApiError ? view.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <TimetableStats
        input={
          data
            ? data.scope === 'CLASS'
              ? { scope: 'CLASS', stats: data.timetable.stats }
              : { scope: 'TEACHER', stats: data.stats }
            : null
        }
      />

      {view.isPending ? (
        <Skeleton className="h-130 rounded-xl" />
      ) : data?.scope === 'CLASS' ? (
        <div className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card)">
          <TimetableBoard grid={classGridOf(data.timetable)} canManage={false} />
        </div>
      ) : data?.scope === 'TEACHER' ? (
        <div className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card)">
          <TimetableBoard grid={teacherGridOf(data.periods, data.days)} canManage={false} emptyLabel="—" />
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No timetable yet"
          description="Your timetable has not been published yet."
        />
      )}
    </div>
  )
}
