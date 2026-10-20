import { describe, expect, it } from 'vitest'
import {
  expectedPace,
  longRunHint,
  longRunLimit,
  plannedLongRun,
  taperLongRunLimit,
} from './wizard'

describe('expected pace', () => {
  const basePace = 360
  const goalPace = 300

  it('uses a finite goal pace when the race is exactly 35 days away', () => {
    const pace = expectedPace(basePace, goalPace, 0, 0)

    expect(pace).toBe(goalPace)
    expect(Number.isFinite(pace)).toBe(true)
  })

  it('uses a finite goal pace when the race is less than 35 days away', () => {
    const pace = expectedPace(basePace, goalPace, 0, -14)

    expect(pace).toBe(goalPace)
    expect(Number.isFinite(pace)).toBe(true)
  })

  it('interpolates finite paces from the start to the goal for a much longer plan', () => {
    const buildupDays = 105
    const paces = [
      expectedPace(basePace, goalPace, 0, buildupDays),
      expectedPace(basePace, goalPace, buildupDays / 2, buildupDays),
      expectedPace(basePace, goalPace, buildupDays, buildupDays),
    ]

    expect(paces).toEqual([basePace, 330, goalPace])
    expect(paces.every(Number.isFinite)).toBe(true)
  })
})

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

describe('long run rules by plan type', () => {
  it('plans a quarter of the week for race plans below 30 km/week', () => {
    expect(plannedLongRun(25, 16)).toBe(6)
    expect(plannedLongRun(20, 12)).toBe(5)
  })

  it('keeps the 40 % rule for "Ausdauer erhalten" below 30 km/week', () => {
    expect(plannedLongRun(25, 16, { maintain: true })).toBe(10)
  })

  it('limits taper long runs by the 25–40 % rule', () => {
    expect(longRunLimit(45, 45)).toBe(18)
    expect(longRunLimit(40, 45)).toBe(16)
    expect(longRunLimit(55, 20)).toBe(20)
  })

  it('leaves taper long runs of all previously allowed inputs unchanged', () => {
    const taperShares = [0.41, 0.45, 0.53, 0.55, 0.65, 0.71, 0.8]
    for (let peak = 10; peak <= 220; peak++)
      for (let cap = 8; cap <= Math.min(45, peak * 0.5); cap++)
        for (const f of taperShares) {
          const taper = Math.round(cap * f)
          expect(Math.min(taper, taperLongRunLimit(peak, cap))).toBe(taper)
        }
  })

  it('keeps taper long runs at the hinted length above half the peak volume', () => {
    expect(taperLongRunLimit(25, 16)).toBe(6)
    expect(taperLongRunLimit(20, 12)).toBe(5)
    expect(taperLongRunLimit(45, 45)).toBe(18)
    for (let peak = 10; peak <= 220; peak++)
      for (let cap = 8; cap <= 45; cap++)
        if (cap > peak * 0.5) expect(taperLongRunLimit(peak, cap)).toBe(plannedLongRun(peak, cap))
  })

  it('uses the 25–40 % rule for taper long runs up to half the peak volume', () => {
    expect(taperLongRunLimit(25, 12)).toBe(longRunLimit(25, 12))
    expect(taperLongRunLimit(55, 27)).toBe(22)
  })
})

describe('long run hint wording', () => {
  it('names the quarter rule for race plans below 30 km/week', () => {
    expect(longRunHint(25, 16)).toBe(
      'Hinweis: Dein längster Lauf ist mehr als die Hälfte deines Höchstumfangs. Im Plan wird er in den umfangreichsten Wochen etwa 6 km lang, weil der längste Lauf bei weniger als 30 km pro Woche ein Viertel des Wochenumfangs ist.',
    )
  })

  it('talks about the weekly volume for "Ausdauer erhalten"', () => {
    expect(longRunHint(40, 25, { maintain: true })).toBe(
      'Hinweis: Dein längster Lauf ist mehr als die Hälfte deines Wochenumfangs. Im Plan wird er etwa 16 km lang, weil ein Lauf höchstens 40 % des Wochenumfangs ausmacht.',
    )
  })
})
