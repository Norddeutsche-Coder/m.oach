import type { PaceZones } from '../plan/types'

/** Category of a run: easy, quality session, long run or race. */
export type RunKind = 'easy' | 'q' | 'long' | 'race'

/** A logged or imported run: date, distance, duration and optional metrics. */
export interface Run {
  d: string
  km: number
  sec: number
  /** Average heart rate in bpm. */
  hr?: number
  /** Maximum heart rate in bpm. */
  mx?: number
  /** Perceived exertion from 1 to 10. */
  rpe?: number
  /** Training load. */
  ld?: number
  /** Elevation gain in metres. */
  el?: number
  manual?: boolean
  n?: string
}

/** The planned session of a day: type (a run kind, `rest` or another type) and distance. */
export interface PlannedRun {
  t: string
  km?: number
}

/** Context for the analysis: all runs, plan lookup, pace zones and derived reference values. */
export interface RunContext {
  runs: readonly Run[]
  /** Highest measured heart rate across all runs. */
  hrmax: number | null
  pf: ((date: Date) => PlannedRun | null) | null
  zones: ((date: Date) => PaceZones) | null
  /** Median pace in seconds per km of runs from 3 km. */
  med: number | null
  /** Median distance of runs from 3 km. */
  mkm: number | null
  /** 85th percentile distance of runs from 3 km. */
  k80: number | null
}

/** A problem found in a run, keyed by category. */
export interface RunFinding {
  k: 'fast' | 'long' | 'short' | 'rest' | 'hr' | 'rpe' | 'eff' | 'load' | 'streak'
  t: string
}

/** Result of a run analysis: kind, findings, next steps, notes, verdict and pace. */
export interface RunAnalysis {
  kind: RunKind
  good: string[]
  bad: RunFinding[]
  nxt: string[]
  note: string[]
  v: { t: 'Stark' | 'Gut' | 'Achtung'; c: 'g' | 'y' | 'r' }
  /** Pace in seconds per km, `null` without distance or duration. */
  pc: number | null
}
