/**
 * Deterministic seed helpers for the demo dataset.
 *
 * Everything here is mock-only: the values are derived from fixed lists and index arithmetic
 * (never `Math.random`) so the dataset is stable across reloads, and dates are relative to today so
 * the demo never looks stale. Delete this folder once the backend serves real data.
 */

export const SCHOOL_ID = 'sch_brightfuture'
export const ACADEMIC_YEAR = '2026'

/** Amounts are held in integer minor units (×100) — this is just so the seed files read as dollars. */
export function dollars(amount: number): number {
  return Math.round(amount * 100)
}

function startOfToday(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

/** ISO date (`YYYY-MM-DD`) offset from today. */
export function dateOffset(days: number): string {
  const date = startOfToday()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/** ISO-8601 timestamp offset from today. */
export function dateTimeOffset(days: number, hour = 9, minute = 0): string {
  const date = startOfToday()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

/** The last `count` weekdays, most recent first — used for attendance registers. */
export function recentSchoolDays(count: number): string[] {
  const days: string[] = []
  let offset = 0
  while (days.length < count) {
    const date = startOfToday()
    date.setDate(date.getDate() - offset)
    const weekday = date.getDay()
    if (weekday !== 0 && weekday !== 6) days.push(date.toISOString().slice(0, 10))
    offset++
  }
  return days
}

const FIRST_NAMES = [
  'Ayesha',
  'Rahul',
  'Fatima',
  'Imran',
  'Nusrat',
  'Tanvir',
  'Sadia',
  'Arif',
  'Mehjabin',
  'Sabbir',
  'Rumana',
  'Hasib',
  'Tasnim',
  'Naimul',
  'Sharmin',
  'Rakib',
  'Jannatul',
  'Fahim',
  'Nazia',
  'Shakib',
  'Anika',
  'Rezaul',
  'Mim',
  'Tahmid',
]

const LAST_NAMES = [
  'Khan',
  'Chowdhury',
  'Rahman',
  'Islam',
  'Hossain',
  'Akter',
  'Siddique',
  'Mahmud',
  'Karim',
  'Bhuiyan',
  'Sarker',
  'Talukder',
]

/** Stable name for person `index` (1-based) across every seed file. */
export function personName(index: number): { firstName: string; lastName: string } {
  return {
    firstName: FIRST_NAMES[(index - 1) % FIRST_NAMES.length],
    lastName: LAST_NAMES[(index * 3) % LAST_NAMES.length],
  }
}

export function schoolEmail(index: number, domain: string): string {
  const { firstName, lastName } = personName(index)
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`
}

export const SCHOOL_DOMAIN = 'brightfuture.edu'

/** The one password every demo account uses, and the one invited accounts are emailed in mock mode. */
export const DEMO_PASSWORD = 'demo1234'
