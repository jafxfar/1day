const computeStreak = (completedDates) => {
  if (completedDates.length === 0) return 0

  const toDay = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const today = new Date()
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayMid = new Date(todayMid)
  yesterdayMid.setDate(yesterdayMid.getDate() - 1)

  const firstDate = toDay(completedDates[0])
  const MS_PER_DAY = 86_400_000
  const diffFromToday = (todayMid.getTime() - firstDate.getTime()) / MS_PER_DAY
  const diffFromYesterday = (yesterdayMid.getTime() - firstDate.getTime()) / MS_PER_DAY
  if (diffFromToday !== 0 && diffFromYesterday !== 0) return 0

  const anchor = diffFromToday === 0 ? todayMid : yesterdayMid
  let streak = 0
  for (let i = 0; i < completedDates.length; i++) {
    const expected = new Date(anchor)
    expected.setDate(expected.getDate() - i)
    const actual = toDay(completedDates[i])
    if (actual.getTime() === expected.getTime()) streak++
    else break
  }
  return streak
}

const parseSessionUserId = (token) => {
  if (!token) return null
  const [prefix, userIdRaw] = token.split('.')
  if (prefix !== 'local') return null
  const userId = Number(userIdRaw)
  if (!Number.isInteger(userId) || userId <= 0) return null
  return userId
}

const today = new Date()
const iso = (offsetDays) => {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offsetDays)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

assert(computeStreak([iso(0), iso(1), iso(2)]) === 3, 'streak should be 3')
assert(computeStreak([iso(1), iso(2)]) === 2, 'streak can start yesterday')
assert(computeStreak([iso(3)]) === 0, 'old day breaks streak')
assert(parseSessionUserId('local.42.abc') === 42, 'parse user id')
assert(parseSessionUserId('bad') === null, 'invalid token')

console.log('offline smoke helpers: ok')
