import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { weekdayLabels } from '@/data/timetable'
import { buildToneMap, rowTone, toneChip, toneOf, toneTime } from '@/features/timetable/lib/tones'
import type { TimetableTone } from '@/features/timetable/lib/tones'
import type { ClassTimetable, TimetableSlot, Weekday } from '@/types/timetable'

/** Indexes `Date.getDay()` — Sunday first — onto the weekday enum, to mark today's column. */
const DAY_ORDER: Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

interface TimetableBoardProps {
  timetable: ClassTimetable
  /** Only staff open the entry editor; everyone else reads the same grid. */
  canManage: boolean
  onEditSlot: (day: Weekday, orderIndex: number, label: string) => void
}

export function TimetableBoard({ timetable, canManage, onEditSlot }: TimetableBoardProps) {
  const toneMap = buildToneMap(subjectNamesOf(timetable))
  const subjects = Object.keys(toneMap)
  const today = DAY_ORDER[new Date().getDay()]

  return (
    <div className="space-y-5">
      {subjects.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {subjects.map((name) => (
            <span key={name} className={cn('rounded-full px-3 py-1 text-[12px] font-medium', toneChip[toneMap[name]])}>
              {name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="border-line overflow-hidden rounded-xl border">
        <Table className="min-w-230">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-canvas w-33">Time</TableHead>
              {timetable.days.map((day) => (
                <TableHead key={day.day} className={cn('bg-canvas', day.day === today ? 'text-primary' : undefined)}>
                  {weekdayLabels[day.day]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {timetable.periods.map((row, rowIndex) => (
              <TableRow key={row.orderIndex} className="hover:bg-transparent">
                {/* The TIME column: a soft wash per row, so the day reads down a scale. */}
                <TableCell className={cn('align-middle', toneTime[rowTone(row.orderIndex)])}>
                  <p className="text-[12.5px] font-medium">{row.label}</p>
                  <p className="text-ink-subtle mt-0.5 text-[11px] tabular-nums">
                    {row.startTime} – {row.endTime}
                  </p>
                </TableCell>

                {row.isBreak ? (
                  <TableCell
                    colSpan={timetable.days.length}
                    className="bg-canvas text-ink-subtle text-center text-[11px] font-medium tracking-[0.08em] uppercase">
                    {row.label}
                  </TableCell>
                ) : (
                  timetable.days.map((day) => (
                    <TableCell key={day.day} className="p-1.5">
                      <SlotCell
                        slot={day.slots[rowIndex]}
                        tone={toneOf(toneMap, day.slots[rowIndex].subjectName)}
                        interactive={canManage}
                        onEdit={() => onEditSlot(day.day, row.orderIndex, row.label)}
                      />
                    </TableCell>
                  ))
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function subjectNamesOf(timetable: ClassTimetable): string[] {
  return timetable.days.flatMap((day) =>
    day.slots.map((slot) => slot.subjectName).filter((name): name is string => name !== null),
  )
}

interface SlotCellProps {
  slot: TimetableSlot
  tone: TimetableTone
  interactive: boolean
  onEdit: () => void
}

/**
 * A plain `<div>` when the viewer cannot edit: a read-only week should not be a grid of disabled
 * buttons that announce themselves as unavailable.
 */
function SlotCell({ slot, tone, interactive, onEdit }: SlotCellProps) {
  const className = cn(
    'w-full rounded-lg px-3 py-2 text-left transition duration-200',
    slot.subjectName ? toneChip[tone] : 'border-line text-ink-subtle border border-dashed',
    interactive && 'hover:-translate-y-0.5 hover:shadow-(--shadow-hover)',
  )

  const content = (
    <>
      <p className="truncate text-[12.5px] font-medium">{slot.subjectName ?? 'Free'}</p>
      <p className={cn('mt-0.5 truncate text-[11px]', slot.subjectName ? 'text-ink-muted' : 'text-ink-subtle')}>
        {slot.subjectName ? (slot.teacherName ?? 'Unassigned') : 'No class'}
      </p>
    </>
  )

  if (!interactive) return <div className={className}>{content}</div>

  return (
    <button type="button" onClick={onEdit} className={className}>
      {content}
    </button>
  )
}
