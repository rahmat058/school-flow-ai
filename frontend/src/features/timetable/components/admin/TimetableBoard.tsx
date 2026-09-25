import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { weekdayLabels } from '@/data/timetable'
import { buildToneMap, rowTone, toneChip, toneOf, toneTime } from '@/features/timetable/lib/tones'
import type { TimetableTone } from '@/features/timetable/lib/tones'
import type { TimetableGrid, TimetableGridCell } from '@/features/timetable/lib/grid'
import type { Weekday } from '@/types/timetable'

/** Indexes `Date.getDay()` — Sunday first — onto the weekday enum, to mark today's column. */
const DAY_ORDER: Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const EMPTY_CELL: TimetableGridCell = { subjectName: null, context: null }

interface TimetableBoardProps {
  grid: TimetableGrid
  /** Only staff open the entry editor; everyone else reads the same grid. */
  canManage: boolean
  onEditCell?: (day: Weekday, orderIndex: number, label: string) => void
  /** What a free cell reads: a class week says "Free", a teacher's own week a dash. */
  emptyLabel?: string
}

export function TimetableBoard({ grid, canManage, onEditCell, emptyLabel = 'Free' }: TimetableBoardProps) {
  const toneMap = buildToneMap(subjectNamesOf(grid))
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
              {grid.days.map((day) => (
                <TableHead key={day.day} className={cn('bg-canvas', day.day === today ? 'text-primary' : undefined)}>
                  {weekdayLabels[day.day]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {grid.periods.map((row, rowIndex) => (
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
                    colSpan={grid.days.length}
                    className="bg-canvas text-ink-subtle text-center text-[11px] font-medium tracking-[0.08em] uppercase">
                    {row.label}
                  </TableCell>
                ) : (
                  grid.days.map((day) => {
                    const cell = day.cells[rowIndex] ?? EMPTY_CELL

                    return (
                      <TableCell key={day.day} className="p-1.5">
                        <SlotCell
                          cell={cell}
                          tone={toneOf(toneMap, cell.subjectName)}
                          interactive={canManage}
                          emptyLabel={emptyLabel}
                          onEdit={() => onEditCell?.(day.day, row.orderIndex, row.label)}
                        />
                      </TableCell>
                    )
                  })
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function subjectNamesOf(grid: TimetableGrid): string[] {
  return grid.days.flatMap((day) =>
    day.cells.map((cell) => cell.subjectName).filter((name): name is string => name !== null),
  )
}

interface SlotCellProps {
  cell: TimetableGridCell
  tone: TimetableTone
  interactive: boolean
  emptyLabel: string
  onEdit: () => void
}

/**
 * A plain `<div>` when the viewer cannot edit: a read-only week should not be a grid of disabled
 * buttons that announce themselves as unavailable.
 */
function SlotCell({ cell, tone, interactive, emptyLabel, onEdit }: SlotCellProps) {
  const className = cn(
    'w-full rounded-lg px-3 py-2 text-left transition duration-200',
    cell.subjectName ? toneChip[tone] : 'border-line border border-dashed',
    interactive && 'hover:-translate-y-0.5 hover:shadow-(--shadow-hover)',
  )

  const content = cell.subjectName ? (
    <>
      <p className="truncate text-[12.5px] font-medium">{cell.subjectName}</p>
      <p className="text-ink-muted mt-0.5 truncate text-[11px]">{cell.context ?? 'Unassigned'}</p>
    </>
  ) : (
    <p className="text-ink-subtle text-center text-[12.5px]">{emptyLabel}</p>
  )

  if (!interactive) return <div className={className}>{content}</div>

  return (
    <button type="button" onClick={onEdit} className={className}>
      {content}
    </button>
  )
}
