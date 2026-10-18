import { describe, expect, it } from 'vitest'
import { longRunHint, plannedLongRun } from './wizard'

describe('planned long run', () => {
  it.each([
    [55, 31, 22],
    [55, 20, 20],
    [40, 8, 8],
    [55, 27, 22],
    [100, 35, 35],
    [30, 12, 12],
  ])('peak %i km and longest run %i km give %i km in the peak weeks', (peak, cap, expected) => {
    expect(plannedLongRun(peak, cap)).toBe(expected)
  })

  it('never plans a longer run than entered', () => {
    for (let peak = 10; peak <= 220; peak += 5)
      for (let cap = 8; cap <= 45; cap++) expect(plannedLongRun(peak, cap)).toBeLessThanOrEqual(cap)
  })
})

describe('long run hint', () => {
  it('explains the planned length when the longest run is more than half of the peak', () => {
    expect(longRunHint(55, 31)).toBe(
      'Hinweis: Dein längster Lauf ist mehr als die Hälfte deines Höchstumfangs. Im Plan wird er in den umfangreichsten Wochen etwa 22 km lang, weil ein Lauf höchstens 40 % des Wochenumfangs ausmacht.',
    )
  })

  it.each([
    [55, 27],
    [55, 20],
    [40, 20],
  ])('shows no hint for peak %i km and longest run %i km', (peak, cap) => {
    expect(longRunHint(peak, cap)).toBeNull()
  })

  it('shows no hint without a valid peak volume', () => {
    expect(longRunHint(0, 31)).toBeNull()
    expect(longRunHint(Number.NaN, 31)).toBeNull()
  })
})
