import type { Period, Timetable, Weekday } from '@/types/timetable'
import { ACADEMIC_YEAR, SCHOOL_ID } from '@/data/seed'
import { classes } from '@/data/classes'
import { classSubjectFor, subjectsForClass } from '@/data/subjects'

/** Monday to Saturday — the school week. */
const WEEKDAYS: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export const weekdayLabels: Record<Weekday, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
}

interface RowSpec {
  /** Named rows carry a label; numbered rows leave it null and derive `Period n`. */
  label: string | null
  startTime: string
  endTime: string
  isBreak: boolean
}

/** The period structure every class shares: six teaching periods around two breaks. */
const ROWS: RowSpec[] = [
  { label: null, startTime: '08:00', endTime: '08:45', isBreak: false },
  { label: null, startTime: '08:45', endTime: '09:30', isBreak: false },
  { label: null, startTime: '09:30', endTime: '10:15', isBreak: false },
  { label: 'Short Break', startTime: '10:15', endTime: '10:30', isBreak: true },
  { label: null, startTime: '10:30', endTime: '11:15', isBreak: false },
  { label: null, startTime: '11:15', endTime: '12:00', isBreak: false },
  { label: 'Lunch Break', startTime: '12:00', endTime: '12:40', isBreak: true },
  { label: null, startTime: '12:40', endTime: '13:25', isBreak: false },
]

export const timetables: Timetable[] = classes.flatMap((classRoom, classOffset) =>
  WEEKDAYS.map((day) => ({
    id: `tt_${classOffset + 1}_${day}`,
    schoolId: SCHOOL_ID,
    classId: classRoom.id,
    academicYear: ACADEMIC_YEAR,
    day,
  })),
)

export const periods: Period[] = timetables.flatMap((timetable, timetableOffset) => {
  const classSubjects = subjectsForClass(timetable.classId)

  return ROWS.map((row, rowIndex) => {
    // Breaks carry no subject, and they do not consume a step of the rotation — so the first
    // period after the short break is `Period 4`, the way the grid numbers them.
    const teachingIndex = ROWS.slice(0, rowIndex).filter((item) => !item.isBreak).length
    const subject = row.isBreak ? undefined : classSubjects[(timetableOffset + teachingIndex) % classSubjects.length]

    return {
      id: `per_${timetable.id}_${rowIndex + 1}`,
      schoolId: SCHOOL_ID,
      timetableId: timetable.id,
      subjectId: subject?.id ?? null,
      // Who teaches that subject in *this* class — the teacher lives on the assignment.
      teacherId: subject ? (classSubjectFor(timetable.classId, subject.id)?.teacherId ?? null) : null,
      startTime: row.startTime,
      endTime: row.endTime,
      isBreak: row.isBreak,
      orderIndex: rowIndex,
      room: row.isBreak ? null : `Room ${100 + Number(timetable.classId.replace('cls_', ''))}`,
      label: row.label,
    }
  })
})

export const weekdays = WEEKDAYS
