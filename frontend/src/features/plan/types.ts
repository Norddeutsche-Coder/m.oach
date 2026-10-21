/** A performance result (race or test) used to fit the marathon pace. */
export interface PaceResult {
  d: string
  km: number
  sec: number
}

/** A logged or imported run used for the prognosis. */
export interface PaceRun {
  d: string
  km: number
  sec: number
}

/** Marathon pace in s/km fitted from the newest result. */
export interface FittedPace {
  d: string
  p: number
  r: PaceResult
}

/** Base and goal marathon times in seconds, plan start and race day as ISO dates. */
export interface PaceSchedule {
  baseSeconds: number
  goalSeconds: number
  start: string
  race: string
}

/** Training paces in s/km: marathon, easy (two bounds), threshold, interval, repetition. */
export interface PaceZones {
  mp: number
  e1: number
  e2: number
  t: number
  i: number
  r: number
}

/** Forecast for one distance: age-adjusted seconds (`adj` and `sec`), raw Riegel time, source run. */
export interface Prognosis {
  adj: number
  sec: number
  raw: number
  r: PaceRun
}
