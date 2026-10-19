import type { Tab } from '../lib/navigation'
import type { TodayActions, TodayInput } from '../features/today/types'

export interface LegacyPlanDay {
  t: string
  lab: string
  km: number
  d: string
  str?: string
  mv?: string
}

export interface LegacyPlanPaces {
  mp: number
  e1: number
  e2: number
  t: number
  i: number
  r: number
}

export interface LegacyPlanState extends Record<string, unknown> {
  start?: string | null
  race?: string
  runs?: ReadonlyArray<Record<string, unknown>>
  res?: ReadonlyArray<Record<string, unknown>>
  log?: Readonly<Record<string, unknown>>
}

export interface LegacyPlanWizardInput {
  type: 'race' | 'maintain'
  rd: number
  race: string
  gh: number
  gm: number
  gs: number
  weeks: number
  rk: number
  rh: number
  rm: number
  rs: number
  cur: number
  peak: number
  cap: number
  rest: number[]
  lg: number
  str: number
  q: number
  start: string
  tp: number
  tune?: Array<{ id: string; d: string; km: number; m: string; n: string }>
}

export interface LegacyPlanWizardState extends LegacyPlanState {
  start: string
  race: string
  goal: number
  goalT: number | null
  rd: number
  base: number
  cfg: Record<string, unknown>
  tune: Array<{ id: string; d: string; km: number; m: string; n: string }> | null
}

export interface LegacyPlanPrognosis {
  adj: number
  sec: number
  raw: number
  r: Record<string, unknown>
}

export interface LegacyPlanGoldenMasterApi {
  setState(state: Readonly<LegacyPlanState>): void
  plan(date: Date, noAdaptation?: boolean): LegacyPlanDay | null
  Z(date: Date): LegacyPlanPaces
  ph(weeksToRace: number): string
  vol(weeksToRace: number): number
  progn(): Record<string, LegacyPlanPrognosis>
  wzState(input: LegacyPlanWizardInput): LegacyPlanWizardState
  wtr(date: Date): number
  dispose(): void
}

export interface LegacyApp {
  navigate(tab: Tab): void
  sync(): void
  dispose(): void
  today: TodayActions
  __planGoldenMaster?: LegacyPlanGoldenMasterApi
}
export function initializeLegacyApp(callbacks: {
  onTabChange(tab: Tab): void
  onCoachChange(enabled: boolean): void
  onTodayChange(input: TodayInput): void
}): LegacyApp
