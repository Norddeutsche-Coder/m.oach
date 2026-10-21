import { addD, iso, mon, parse } from '../../lib/format'
import type { FittedPace, PaceResult, PaceRun, PaceSchedule, PaceZones, Prognosis } from './types'
import { expectedPace } from './wizard'

const MARATHON_KM = 42.195
const RIEGEL_EXPONENT = 1.06
const DAY_MS = 24 * 60 * 60 * 1000
const PROGNOSIS_WINDOW_DAYS = 7 * 26
const PROGNOSIS_DISTANCES = [5, 10, 15, 21.0975, MARATHON_KM] as const

const riegel = (seconds: number, fromKm: number, toKm: number): number =>
  seconds * Math.pow(toKm / fromKm, RIEGEL_EXPONENT)

// UTC on the local date components counts calendar days, so DST changes do not skew the count.
const dayNumber = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS

export const calendarDays = (from: Date, to: Date): number => dayNumber(to) - dayNumber(from)

/** Marathon pace of the newest result; on equal dates the later entry wins. */
export function fitP(results: readonly PaceResult[]): FittedPace | null {
  let best: FittedPace | null = null
  for (const r of results) {
    const p = riegel(r.sec, r.km, MARATHON_KM) / MARATHON_KM
    if (!best || r.d >= best.d) best = { d: r.d, p, r }
  }
  return best
}

/** Scheduled marathon pace: base pace moving to goal pace until 35 days before race week. */
export function expP(date: Date, schedule: PaceSchedule): number {
  const start = parse(schedule.start)
  const buildupEnd = addD(mon(parse(schedule.race)), -35)
  return expectedPace(
    schedule.baseSeconds / MARATHON_KM,
    schedule.goalSeconds / MARATHON_KM,
    calendarDays(start, date),
    calendarDays(start, buildupEnd),
  )
}

/** Training zones from the fitted result or the scheduled pace, never faster than the goal. */
export function Z(
  date: Date,
  schedule: PaceSchedule & { results: readonly PaceResult[] },
): PaceZones {
  const fitted = fitP(schedule.results)
  const pace = Math.max(
    fitted ? fitted.p : expP(date, schedule),
    schedule.goalSeconds / MARATHON_KM,
  )
  return {
    mp: pace,
    e1: pace * 1.16,
    e2: pace * 1.3,
    t: pace * 0.945,
    i: pace * 0.91,
    r: pace * 0.87,
  }
}

const usableRun = (r: PaceRun): boolean => {
  if (!(r.km >= 3 && r.sec > 0) || r.km > 70) return false
  const pace = r.sec / r.km
  return pace >= 150 && pace <= 540
}

/** Best age-adjusted Riegel forecast per distance from runs of the last 26 weeks up to `asOf`. */
export function progn(runs: readonly PaceRun[], asOf: Date): Record<number, Prognosis> {
  const hi = iso(asOf)
  const lo = iso(addD(asOf, -PROGNOSIS_WINDOW_DAYS))
  const recent = runs.filter((r) => r.d <= hi && r.d >= lo && usableRun(r))
  const forecasts: Record<number, Prognosis> = {}
  for (const km of PROGNOSIS_DISTANCES) {
    let best: Prognosis | null = null
    for (const r of recent) {
      if (km >= 10 && r.km < km * 0.3) continue
      const weeks = Math.max(0, calendarDays(parse(r.d), asOf) / 7)
      const raw = riegel(r.sec, r.km, km)
      const adj = raw * (1 + 0.004 * weeks)
      if (!best || adj < best.adj) best = { adj, sec: adj, raw, r }
    }
    if (best) forecasts[km] = best
  }
  return forecasts
}

/** Tune-up target: direct prognosis, else marathon prognosis, fitted result or base via Riegel. */
export function tuneTarget(
  km: number,
  input: {
    runs: readonly PaceRun[]
    results: readonly PaceResult[]
    baseSeconds: number
    asOf: Date
  },
): number {
  const forecasts = progn(input.runs, input.asOf)
  const direct = forecasts[km]
  if (direct) return direct.sec
  const fitted = fitP(input.results)
  const marathon =
    forecasts[MARATHON_KM]?.sec ?? (fitted ? fitted.p * MARATHON_KM : input.baseSeconds)
  return riegel(marathon, MARATHON_KM, km)
}
