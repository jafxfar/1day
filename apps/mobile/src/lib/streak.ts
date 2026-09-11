export const computeStreak = (completedDates: string[]): number => {
  if (completedDates.length === 0) return 0

  const toDay = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
    return new Date(y, m - 1, d)
  }

  const today = new Date()
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayMid = new Date(todayMid)
  yesterdayMid.setDate(yesterdayMid.getDate() - 1)

  const firstDate = toDay(completedDates[0]!)
  const MS_PER_DAY = 86_400_000

  const diffFromToday = (todayMid.getTime() - firstDate.getTime()) / MS_PER_DAY
  const diffFromYesterday = (yesterdayMid.getTime() - firstDate.getTime()) / MS_PER_DAY

  if (diffFromToday !== 0 && diffFromYesterday !== 0) return 0

  const anchor = diffFromToday === 0 ? todayMid : yesterdayMid

  let streak = 0
  for (let i = 0; i < completedDates.length; i++) {
    const expected = new Date(anchor)
    expected.setDate(expected.getDate() - i)
    const actual = toDay(completedDates[i]!)

    if (actual.getTime() === expected.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}
