import type { ClassTimetable, TeacherTimetableDay, TimetablePeriodRow, Weekday } from '@/types/timetable'

/**
 * What the week grid renders, whichever week it is. The top line is always the subject; the bottom
 * line is the other party — the teacher for a class's week, the class for a teacher's own — so both
 * views share one board instead of two grids that would drift apart.
 */
export interface TimetableGridCell {
  subjectName: string | null
  context: string | null
}

export interface TimetableGridDay {
  day: Weekday
  cells: TimetableGridCell[]
}

export interface TimetableGrid {
  periods: TimetablePeriodRow[]
  days: TimetableGridDay[]
}

/** A class's week: each cell names the teacher taking it. */
export function classGridOf(timetable: ClassTimetable): TimetableGrid {
  return {
    periods: timetable.periods,
    days: timetable.days.map((day) => ({
      day: day.day,
      cells: day.slots.map((slot) => ({ subjectName: slot.subjectName, context: slot.teacherName })),
    })),
  }
}

/** A teacher's own week: each cell names the class they are in. */
export function teacherGridOf(periods: TimetablePeriodRow[], days: TeacherTimetableDay[]): TimetableGrid {
  return {
    periods,
    days: days.map((day) => ({
      day: day.day,
      cells: day.slots.map((slot) => ({ subjectName: slot.subjectName, context: slot.className })),
    })),
  }
}
