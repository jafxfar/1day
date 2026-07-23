
/**
 * Streak computation utilities.
 *
 * Design decision: compute streak in TypeScript rather than SQL.
 * Rationale: pure function, trivially unit-testable, and the query
 * that fetches logs is already needed for completedToday.
 */

/**
 * Compute the current streak from a list of completed log dates, sorted DESC.
 *
 * A streak is the number of consecutive calendar days ending on either
 * today or yesterday. If the most recent completed log is neither today
 * nor yesterday the streak is 0 (broken).
 *
 * @param completedDates - ISO date strings ("YYYY-MM-DD") of completed logs,
 *   newest first. Only completed=true rows should be included.
 */
export function computeStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0

  const toDay = (iso: string) => {
    // Parse date components to avoid timezone shifts from `new Date(iso)`
    const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
    return new Date(y, m - 1, d)
  }

  const today     = new Date()
  const todayMid  = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayMid = new Date(todayMid)
  yesterdayMid.setDate(yesterdayMid.getDate() - 1)

  const firstDate = toDay(completedDates[0]!)
  const MS_PER_DAY = 86_400_000

  // Streak must start from today or yesterday; otherwise it's broken
  const diffFromToday     = (todayMid.getTime()     - firstDate.getTime()) / MS_PER_DAY
  const diffFromYesterday = (yesterdayMid.getTime() - firstDate.getTime()) / MS_PER_DAY

  if (diffFromToday !== 0 && diffFromYesterday !== 0) return 0

  // Anchor: the "expected" date for offset i is anchor - i days
  const anchor = diffFromToday === 0 ? todayMid : yesterdayMid

  let streak = 0
  for (let i = 0; i < completedDates.length; i++) {
    const expected = new Date(anchor)
    expected.setDate(expected.getDate() - i)
    const actual = toDay(completedDates[i]!)

    if (actual.getTime() === expected.getTime()) {
      streak++
    } else {
      break // Gap found — streak is over
    }
  }

  return streak
}
