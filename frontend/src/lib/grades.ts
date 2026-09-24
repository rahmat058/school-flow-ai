/**
 * The grade bands used across the marks grid, the report cards and the student profile.
 * `PRD.md` §4.9 has the real backend read these from `schools.settings`, so the bands are the one
 * thing this module assumes rather than stores.
 */
export function gradeForPercentage(percentage: number): string {
  if (percentage >= 80) return 'A+'
  if (percentage >= 70) return 'A'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D'
  return 'F'
}

export const PASS_PERCENTAGE = 40

export function isPass(percentage: number): boolean {
  return percentage >= PASS_PERCENTAGE
}

/** Rounded percentage — above 100 when a mark was typed past the paper's total, as the grid shows. */
export function percentageOf(marks: number, outOf: number): number {
  return outOf <= 0 ? 0 : Math.round((marks / outOf) * 100)
}
