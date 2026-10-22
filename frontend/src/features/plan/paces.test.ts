import { describe, expect, it } from 'vitest'
import { parse } from '../../lib/format'
import { expP, fitP, progn, tuneTarget, Z } from './paces'

type Run = {
  d: string
  km: number
  sec: number
}

const MARATHON_KM = 42.195
const HALF_MARATHON_KM = 21.0975
const PROGNOSIS_DISTANCES = [5, 10, 15, HALF_MARATHON_KM, MARATHON_KM]
const TARGET_DISTANCES = [5, 10, HALF_MARATHON_KM, MARATHON_KM]
const ZONE_FACTORS = { e1: 1.16, e2: 1.3, t: 0.945, i: 0.91, r: 0.87 }

const riegelTime = (seconds: number, sourceKm: number, targetKm: number): number =>
  seconds * Math.pow(targetKm / sourceKm, 1.06)

const marathonPace = (result: Run): number =>
  riegelTime(result.sec, result.km, MARATHON_KM) / MARATHON_KM

const distancesOf = (forecasts: object): number[] =>
  Object.keys(forecasts)
    .map(Number)
    .sort((a, b) => a - b)

// The race is a Sunday: the buildup ends on the Monday of race week minus 35 days (2026-05-04),
// which is 70 local calendar days after the start and crosses the daylight-saving change.
const schedule = {
  baseSeconds: 4 * 60 * 60,
  goalSeconds: 3 * 60 * 60,
  start: '2026-02-23',
  race: '2026-06-14',
}
const basePace = schedule.baseSeconds / MARATHON_KM
const goalPace = schedule.goalSeconds / MARATHON_KM

const expectZones = (zones: ReturnType<typeof Z>, pace: number): void => {
  expect(zones.mp).toBeCloseTo(pace, 10)
  for (const [zone, factor] of Object.entries(ZONE_FACTORS))
    expect(zones[zone as keyof typeof ZONE_FACTORS]).toBeCloseTo(pace * factor, 10)
}

describe('fitP', () => {
  it('returns null without a performance result', () => {
    expect(fitP([])).toBeNull()
  })

  it('converts a result to marathon pace with the Riegel exponent 1.06', () => {
    const result = { d: '2026-10-12', km: 10, sec: 50 * 60 }

    const fitted = fitP([result])

    expect(fitted?.p).toBeCloseTo(marathonPace(result), 10)
    expect(fitted?.p).toBeCloseTo(327.067140651, 6)
  })

  it('keeps a marathon result at its own pace', () => {
    const result = { d: '2026-10-12', km: MARATHON_KM, sec: 3 * 60 * 60 }

    expect(fitP([result])?.p).toBeCloseTo(result.sec / MARATHON_KM, 10)
  })

  it('uses the newest result when it comes first', () => {
    const newest = { d: '2026-10-12', km: 5, sec: 25 * 60 }
    const results = [newest, { d: '2026-09-30', km: 10, sec: 45 * 60 }]

    const fitted = fitP(results)

    expect(fitted).toEqual({ d: newest.d, p: expect.any(Number), r: newest })
    expect(fitted?.r).toBe(newest)
    expect(fitted?.p).toBeCloseTo(marathonPace(newest), 10)
  })

  it('uses the newest result when it comes last', () => {
    const newest = { d: '2026-10-12', km: 5, sec: 25 * 60 }
    const results = [
      { d: '2026-09-30', km: 10, sec: 45 * 60 },
      { d: '2026-08-01', km: HALF_MARATHON_KM, sec: 100 * 60 },
      newest,
    ]

    expect(fitP(results)?.r).toBe(newest)
  })

  it('lets the later entry win when two results share the newest date', () => {
    const first = { d: '2026-10-12', km: 5, sec: 25 * 60 }
    const later = { d: '2026-10-12', km: 10, sec: 52 * 60 }

    const fitted = fitP([first, later, { d: '2026-10-01', km: 5, sec: 20 * 60 }])

    expect(fitted?.r).toBe(later)
    expect(fitted?.d).toBe('2026-10-12')
    expect(fitted?.p).toBeCloseTo(marathonPace(later), 10)
  })
})

describe('expP', () => {
  it('keeps the base pace before and on the plan start', () => {
    expect(expP(parse('2026-02-16'), schedule)).toBeCloseTo(basePace, 10)
    expect(expP(parse(schedule.start), schedule)).toBeCloseTo(basePace, 10)
  })

  it('interpolates by local calendar days across the daylight-saving change', () => {
    // Day 14 of 70 and day 35 of 70; elapsed milliseconds across DST must not skew the progress.
    expect(expP(parse('2026-03-09'), schedule)).toBeCloseTo(
      basePace + (goalPace - basePace) * 0.2,
      10,
    )
    expect(expP(parse('2026-03-30'), schedule)).toBeCloseTo((basePace + goalPace) / 2, 10)
  })

  it('reaches the goal pace on the Monday of race week minus 35 days, not race day minus 35', () => {
    expect(expP(parse('2026-05-03'), schedule)).toBeCloseTo(
      basePace + ((goalPace - basePace) * 69) / 70,
      10,
    )
    expect(expP(parse('2026-05-04'), schedule)).toBeCloseTo(goalPace, 10)
  })

  it('keeps the goal pace after the buildup end, on race day, and after the race', () => {
    expect(expP(parse('2026-05-10'), schedule)).toBeCloseTo(goalPace, 10)
    expect(expP(parse(schedule.race), schedule)).toBeCloseTo(goalPace, 10)
    expect(expP(parse('2026-07-01'), schedule)).toBeCloseTo(goalPace, 10)
  })

  it.each([
    ['Sunday', '2026-05-10', '2026-06-14'],
    ['Monday', '2026-05-11', '2026-06-15'],
  ])(
    'regression #21: stays finite at goal pace when a %s race is exactly 35 days after the start',
    (_weekday, start, race) => {
      const shortSchedule = { ...schedule, start, race }

      for (const date of [start, race]) {
        const pace = expP(parse(date), shortSchedule)

        expect(Number.isFinite(pace)).toBe(true)
        expect(pace).toBeCloseTo(goalPace, 10)
      }
    },
  )

  it('uses the goal pace when the race is less than 35 days after the start', () => {
    const shortSchedule = { ...schedule, start: '2026-06-01' }

    expect(expP(parse('2026-06-01'), shortSchedule)).toBeCloseTo(goalPace, 10)
  })
})

describe('Z', () => {
  it('derives every zone from the scheduled pace when there is no result', () => {
    expectZones(Z(parse('2026-03-30'), { ...schedule, results: [] }), (basePace + goalPace) / 2)
    expectZones(Z(parse(schedule.start), { ...schedule, results: [] }), basePace)
  })

  it('uses the newest fitted result instead of the scheduled pace and applies the zone factors', () => {
    const newest = { d: '2026-10-12', km: 10, sec: 50 * 60 }
    const results = [newest, { d: '2026-09-01', km: 10, sec: 55 * 60 }]

    expectZones(Z(parse(schedule.start), { ...schedule, results }), marathonPace(newest))
  })

  it('never lets a fitted result make marathon pace faster than the goal', () => {
    const fasterThanGoal = { d: '2026-10-12', km: 5, sec: 15 * 60 }

    expectZones(Z(parse('2026-03-30'), { ...schedule, results: [fasterThanGoal] }), goalPace)
  })

  it('never lets the scheduled pace without a result be faster than the goal', () => {
    const fasterBase = { ...schedule, baseSeconds: 2 * 60 * 60 + 50 * 60, results: [] }

    expectZones(Z(parse(schedule.start), fasterBase), goalPace)
  })
})

describe('progn', () => {
  const asOf = parse('2026-10-20')

  it('returns no forecast without usable runs', () => {
    expect(progn([], asOf)).toEqual({})
  })

  it('returns forecasts for 5 km, 10 km, 15 km, half marathon, and marathon', () => {
    const run = { d: '2026-10-20', km: 13, sec: 65 * 60 }

    expect(distancesOf(progn([run], asOf))).toEqual(PROGNOSIS_DISTANCES)
  })

  it.each(PROGNOSIS_DISTANCES)('scales a same-day run with Riegel 1.06 to %s km', (km) => {
    const run = { d: '2026-10-20', km: 13, sec: 65 * 60 }
    const forecast = progn([run], asOf)[km]
    const raw = riegelTime(run.sec, run.km, km)

    expect(forecast.raw).toBeCloseTo(raw, 10)
    expect(forecast.adj).toBeCloseTo(raw, 10)
    expect(forecast.sec).toBe(forecast.adj)
    expect(forecast.r).toBe(run)
  })

  it('keeps the legacy forecast shape with adjusted time, raw time, and source run', () => {
    const run = { d: '2026-10-13', km: 10, sec: 50 * 60 }
    const forecast = progn([run], asOf)[10]
    const raw = riegelTime(run.sec, run.km, 10)

    expect(forecast).toEqual({ adj: expect.any(Number), sec: expect.any(Number), raw, r: run })
    expect(forecast.adj).toBeCloseTo(raw * 1.004, 10)
    expect(forecast.sec).toBe(forecast.adj)
    expect(forecast.r).toBe(run)
  })

  it('ages runs by 0.4 percent per week in local calendar days across daylight saving', () => {
    // 14 calendar days before 2026-11-03, across the autumn clock change.
    const run = { d: '2026-10-20', km: 10, sec: 50 * 60 }
    const forecast = progn([run], parse('2026-11-03'))[10]

    expect(forecast.adj).toBeCloseTo(run.sec * 1.008, 10)
  })

  it('includes the 26-week boundary and the as-of day but excludes older and future runs', () => {
    const boundary = { d: '2026-04-21', km: 13, sec: 65 * 60 }
    const older = { d: '2026-04-20', km: 13, sec: 45 * 60 }
    const future = { d: '2026-10-21', km: 13, sec: 40 * 60 }
    const today = { d: '2026-10-20', km: 13, sec: 70 * 60 }

    const withBoundary = progn([older, future, boundary], asOf)
    expect(distancesOf(withBoundary)).toEqual(PROGNOSIS_DISTANCES)
    for (const forecast of Object.values(withBoundary)) expect(forecast.r).toBe(boundary)

    expect(progn([today], asOf)[5].r).toBe(today)
    expect(progn([older, future], asOf)).toEqual({})
  })

  it('requires at least 3 km and a positive time', () => {
    const tooShort = { d: '2026-10-20', km: 2.99, sec: 2.99 * 300 }
    const noTime = { d: '2026-10-20', km: 10, sec: 0 }
    const missingTime = { d: '2026-10-20', km: 10, sec: Number.NaN }
    const missingDistance = { d: '2026-10-20', km: Number.NaN, sec: 50 * 60 }
    const shortest = { d: '2026-10-20', km: 3, sec: 3 * 300 }

    expect(progn([tooShort, noTime, missingTime, missingDistance], asOf)).toEqual({})
    expect(progn([shortest], asOf)[5].r).toBe(shortest)
  })

  it('excludes runs longer than 70 km', () => {
    const tooLong = { d: '2026-10-20', km: 70.1, sec: 70.1 * 400 }
    const longest = { d: '2026-10-20', km: 70, sec: 70 * 400 }

    expect(progn([tooLong], asOf)).toEqual({})
    expect(progn([longest], asOf)[MARATHON_KM].r).toBe(longest)
  })

  it('requires 30 percent of the target distance from 10 km upwards', () => {
    const run = (km: number) => ({ d: '2026-10-20', km, sec: km * 300 })

    expect(distancesOf(progn([run(3)], asOf))).toEqual([5, 10])
    expect(distancesOf(progn([run(4.49)], asOf))).toEqual([5, 10])
    expect(distancesOf(progn([run(15 * 0.3)], asOf))).toEqual([5, 10, 15])
    expect(distancesOf(progn([run(HALF_MARATHON_KM * 0.3 - 0.01)], asOf))).toEqual([5, 10, 15])
    expect(distancesOf(progn([run(HALF_MARATHON_KM * 0.3)], asOf))).toEqual([
      5,
      10,
      15,
      HALF_MARATHON_KM,
    ])
    expect(distancesOf(progn([run(MARATHON_KM * 0.3 - 0.01)], asOf))).toEqual([
      5,
      10,
      15,
      HALF_MARATHON_KM,
    ])
    expect(distancesOf(progn([run(MARATHON_KM * 0.3)], asOf))).toEqual(PROGNOSIS_DISTANCES)
  })

  it('accepts 150 and 540 s/km but rejects paces outside that range', () => {
    const tooFast = { d: '2026-10-20', km: 5, sec: 5 * 149 }
    const lowerBoundary = { d: '2026-10-20', km: 5, sec: 5 * 150 }
    const upperBoundary = { d: '2026-10-20', km: 5, sec: 5 * 540 }
    const tooSlow = { d: '2026-10-20', km: 5, sec: 5 * 541 }

    expect(progn([tooFast, tooSlow], asOf)).toEqual({})
    expect(progn([lowerBoundary], asOf)[5]?.r).toBe(lowerBoundary)
    expect(progn([upperBoundary], asOf)[5]?.r).toBe(upperBoundary)
  })

  it('selects the best age-adjusted forecast rather than the best raw time', () => {
    const current = { d: '2026-10-20', km: 5, sec: 1000 }
    const weekOld = { d: '2026-10-13', km: 5, sec: 997 }

    const forecast = progn([weekOld, current], asOf)[5]

    expect(forecast.r).toBe(current)
    expect(forecast.raw).toBe(1000)
    expect(forecast.adj).toBe(1000)
  })

  it('still prefers an older run when its age-adjusted time is better', () => {
    const current = { d: '2026-10-20', km: 5, sec: 1000 }
    const weekOld = { d: '2026-10-13', km: 5, sec: 990 }

    const forecast = progn([current, weekOld], asOf)[5]

    expect(forecast.r).toBe(weekOld)
    expect(forecast.adj).toBeCloseTo(990 * 1.004, 10)
  })

  it('keeps the first run when two runs have the same adjusted time', () => {
    const first = { d: '2026-10-20', km: 10, sec: 50 * 60 }
    const second = { d: '2026-10-20', km: 10, sec: 50 * 60 }

    for (const forecast of Object.values(progn([first, second], asOf)))
      expect(forecast.r).toBe(first)
  })
})

describe('tuneTarget', () => {
  const asOf = parse('2026-10-20')
  const result = { d: '2026-10-19', km: 10, sec: 50 * 60 }
  const emptyFallbacks = { runs: [], results: [], baseSeconds: 4 * 60 * 60, asOf }

  it.each([
    [5, 20 * 60],
    [10, 45 * 60],
    [15, 70 * 60],
    [HALF_MARATHON_KM, 105 * 60],
    [MARATHON_KM, 220 * 60],
  ])('uses the direct prognosis for %s km', (km, seconds) => {
    const run = { d: '2026-10-20', km, sec: seconds }

    expect(
      tuneTarget(km, { runs: [run], results: [result], baseSeconds: 5 * 60 * 60, asOf }),
    ).toBeCloseTo(seconds, 10)
  })

  it.each([8, 30])(
    'scales the marathon prognosis for %s km, which has no direct prognosis',
    (km) => {
      const run = { d: '2026-10-20', km: 13, sec: 65 * 60 }
      const marathon = progn([run], asOf)[MARATHON_KM].sec

      expect(tuneTarget(km, { ...emptyFallbacks, runs: [run], results: [result] })).toBeCloseTo(
        riegelTime(marathon, MARATHON_KM, km),
        10,
      )
    },
  )

  it('falls back to the fitted result when runs give no marathon prognosis', () => {
    const shortRun = { d: '2026-10-20', km: 5, sec: 20 * 60 }
    const fittedMarathon = marathonPace(result) * MARATHON_KM

    expect(
      tuneTarget(HALF_MARATHON_KM, { ...emptyFallbacks, runs: [shortRun], results: [result] }),
    ).toBeCloseTo(riegelTime(fittedMarathon, MARATHON_KM, HALF_MARATHON_KM), 10)
  })

  it.each([...TARGET_DISTANCES, 15])('falls back to the latest fitted result for %s km', (km) => {
    const older = { d: '2026-09-01', km: 5, sec: 30 * 60 }
    const fittedMarathon = marathonPace(result) * MARATHON_KM

    expect(tuneTarget(km, { ...emptyFallbacks, results: [result, older] })).toBeCloseTo(
      riegelTime(fittedMarathon, MARATHON_KM, km),
      10,
    )
  })

  it.each([...TARGET_DISTANCES, 15])('falls back to the base marathon time for %s km', (km) => {
    expect(tuneTarget(km, emptyFallbacks)).toBeCloseTo(
      riegelTime(emptyFallbacks.baseSeconds, MARATHON_KM, km),
      10,
    )
  })

  it('ignores runs outside the 26-week window when falling back', () => {
    const tooOld = { d: '2026-04-20', km: MARATHON_KM, sec: 200 * 60 }

    expect(tuneTarget(MARATHON_KM, { ...emptyFallbacks, runs: [tooOld] })).toBeCloseTo(
      emptyFallbacks.baseSeconds,
      10,
    )
  })
})
