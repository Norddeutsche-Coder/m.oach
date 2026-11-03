export type PlanType = 'race' | 'maintain'

export type PlanRole = 'rest' | 'easy' | 'str' | 'q1' | 'q2' | 'long'

export type PhaseThresholds = [number, number, number, number, number]

export type VolumePoint = [weeksToRace: number, volume: number]

export type PlanConfigInput = {
  type: PlanType
  start: string
  race: string
  weeks: number
  cur: number
  peak: number
  cap: number
  rest: readonly number[]
  lg: number
  str: number
  q: number
  tp: number
}

export type PlanConfig = {
  tw: number
  T: PhaseThresholds
  S: number
  A: VolumePoint[]
  cap: number
  ls: number
  tl: number[]
  roles: PlanRole[]
  W: number[]
  strD: number[]
  test: number
  recov: number
  first: number
  fw: number[]
  mul: boolean
  mode?: 'maintain'
  tp?: number
  tv?: number
}

export type TaperConfig = {
  tp?: number
  tv?: number
}

export type VolumeConfig = {
  A: readonly VolumePoint[]
}

export type PhaseConfig = TaperConfig & {
  mode?: 'maintain'
  T: readonly [number, number, number, number, number]
}

export type DeloadConfig = TaperConfig & {
  mode?: 'maintain'
  tw: number
  T: readonly [number, number, number, number, number]
  test: number
  recov: number
}

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

/** Kind of a planned training day. */
export type PlanDayType = 'rest' | 'easy' | 'q' | 'long' | 'race'

/** One planned training day: type, label, distance in km, description and optional strength text. */
export interface PlanDay {
  t: PlanDayType
  lab: string
  km: number
  d: string
  str?: string
}

/** Part of the plan configuration a maintenance plan needs. */
export type MaintenanceConfig = Pick<PlanConfig, 'roles' | 'A' | 'strD' | 'ls' | 'cap' | 'W'>

/** Plan start, zones of the day and volume factors (week adjustment, 14-day adaptation). */
export interface MaintenanceContext {
  start: Date
  zones: PaceZones
  weekFactor: number
  adaptationFactor: number
}

/** A tune-up race inside a plan. */
export interface TuneRace {
  id: string
  d: string
  km: number
  m: string
  n: string
}

/** Plan fields of an archived or temporarily applied plan. */
export interface PlanSegmentInput {
  start: string
  race: string
  goal: number
  goalT?: number | null
  rd?: number
  base: number
  cfg?: PlanConfig | null
  tune?: readonly TuneRace[] | null
}

/** An archived plan, valid from `start` to `until` (both inclusive ISO dates). */
export interface PlanSegment extends PlanSegmentInput {
  until: string
}

/** Plan fields of the app state. */
export interface PlanFields {
  race: string
  goal: number
  goalT?: number | null
  rd?: number
  base: number
  start?: string | null
  cfg?: PlanConfig | null
  noPlan?: boolean
  tune?: readonly TuneRace[] | null
}
