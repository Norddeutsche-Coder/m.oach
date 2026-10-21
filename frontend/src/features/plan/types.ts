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
