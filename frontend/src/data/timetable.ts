import type { Period, Timetable, Weekday } from '@/types/timetable'
import { ACADEMIC_YEAR, SCHOOL_ID } from '@/data/seed'
import { classes } from '@/data/classes'
import { subjectsForClass } from '@/data/subjects'

const WEEKDAYS: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI']

/** Slot grid: index 3 is the mid-morning break. */
const SLOTS = [
  { startTime: '08:00', endTime: '08:45' },
  { startTime: '08:45', endTime: '09:30' },
  { startTime: '09:30', endTime: '10:15' },
  { startTime: '10:15', endTime: '10:35' },
  { startTime: '10:35', endTime: '11:20' },
  { startTime: '11:20', endTime: '12:05' },
]

const BREAK_INDEX = 3

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

  return SLOTS.map((slot, slotIndex) => {
    const isBreak = slotIndex === BREAK_INDEX
    // Rotate subjects through the day so each class's week looks varied.
    const subject = isBreak ? undefined : classSubjects[(timetableOffset + slotIndex) % classSubjects.length]

    return {
      id: `per_${timetable.id}_${slotIndex + 1}`,
      schoolId: SCHOOL_ID,
      timetableId: timetable.id,
      subjectId: subject?.id ?? null,
      teacherId: subject?.teacherId ?? null,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBreak,
      orderIndex: slotIndex,
      room: isBreak ? null : `Room ${100 + Number(timetable.classId.replace('cls_', ''))}`,
    }
  })
})

export const weekdays = WEEKDAYS
