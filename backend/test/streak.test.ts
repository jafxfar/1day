import { afterEach, describe, expect, it, vi } from 'vitest'
import { computeStreak } from '../src/lib/streak.js'

describe('computeStreak', () => {
  afterEach(() => vi.useRealTimers())

  it('counts consecutive days ending today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 31, 12))
    expect(computeStreak(['2026-07-31', '2026-07-30', '2026-07-29'])).toBe(3)
  })

  it('allows a streak to end yesterday and stops at gaps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 31, 12))
    expect(computeStreak(['2026-07-30', '2026-07-29', '2026-07-27'])).toBe(2)
  })

  it('returns zero for a broken streak', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 31, 12))
    expect(computeStreak(['2026-07-28'])).toBe(0)
  })
})
