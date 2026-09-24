/**
 * Timetable colour.
 *
 * The grid needs to tell subjects apart at a glance, and the palette has exactly five soft fills, so
 * tones are assigned to the class's subjects in a stable sorted order rather than hashed per name —
 * that keeps the legend, the grid and the picker agreeing on a colour, and gives the first five
 * subjects distinct ones. They are the existing design tokens; no colour is invented here.
 */
export type TimetableTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral'

const TONES: TimetableTone[] = ['primary', 'success', 'warning', 'error', 'neutral']

/** Soft fill plus the tone's ink — a legend pill, a grid cell, a chip. */
export const toneChip: Record<TimetableTone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  error: 'bg-error-soft text-error',
  neutral: 'bg-canvas text-ink-muted',
}

/**
 * The TIME column: the same tints as a soft diagonal wash, so the rows read as a scale down the side
 * of the grid instead of a flat list of labels.
 */
export const toneTime: Record<TimetableTone, string> = {
  primary: 'bg-linear-to-br from-primary-soft via-surface to-surface text-primary',
  success: 'bg-linear-to-br from-success-soft via-surface to-surface text-success',
  warning: 'bg-linear-to-br from-warning-soft via-surface to-surface text-warning',
  error: 'bg-linear-to-br from-error-soft via-surface to-surface text-error',
  neutral: 'bg-linear-to-br from-canvas via-surface to-surface text-ink-muted',
}

/** One tone per distinct subject of the class, assigned in sorted order. */
export function buildToneMap(subjectNames: string[]): Record<string, TimetableTone> {
  return [...new Set(subjectNames)].sort().reduce<Record<string, TimetableTone>>((map, name, index) => {
    map[name] = TONES[index % TONES.length]
    return map
  }, {})
}

export function toneOf(map: Record<string, TimetableTone>, subjectName: string | null): TimetableTone {
  return subjectName ? (map[subjectName] ?? 'neutral') : 'neutral'
}

/** The TIME column cycles the tones row by row, so consecutive rows read apart. */
export function rowTone(orderIndex: number): TimetableTone {
  return TONES[orderIndex % TONES.length]
}
