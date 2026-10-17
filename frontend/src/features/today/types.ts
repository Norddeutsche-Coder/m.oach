export type Tone = 'good' | 'bad' | 'neu'
export type TrainingKind = 'rest' | 'easy' | 'q' | 'long' | 'race'
export interface Plan {
  t: TrainingKind; lab: string; km: number; d: string; str?: string
  ttl?: string; kr?: 'A' | 'B'; krs?: number; rep?: { lab: string; km: number }
}
export interface Adjustment {
  mode: 'plan' | 'rest' | 'move' | 'swap' | 'reduced'; km: number; title: string | null; note: string
}
export interface Readiness {
  lvl: 0 | 1 | 2; score: number; adj: number; w: number; pain?: number
  m: { rd?: number }; f: Record<string, number>
}
export interface Trend {
  key: string; name: string; value: string | number; unit: string; arrow: string
  tone: Tone; description: string; values: (number | null)[]
}
export interface Metric {
  key: string; name: string; value: string | number; label: string; tone: Tone
  description: string; values: (number | null)[]
}
export interface Stat { label: string; value: string; detail: string; info: string }
export interface Strength {
  session: 'A' | 'B'; sets: number; name: string; exercises: { name: string; repetitions: string }[]
}
export interface Repair {
  applied: boolean; reasons: string[]
  rows: { date: string; before: string; after: string }[]
}
export interface CoachRequest { id: string; cloud: boolean; name: string; description: string }
export interface LatestRun {
  id: string; name: string; kind: string; color: string; time: string; km: string
  duration: string | null; pace: string | null
}
export interface TodayInput {
  date: string; hour: number; name: string; start: string; noPlan: boolean; maintain: boolean
  plan: Plan | null; adjustment: Adjustment; readiness: Readiness
  zones: { e1: number; e2: number }; abc: boolean; strength: Strength | null
  log: { done?: boolean; km?: string | number; min?: string | number } | null
  stats: Stat[]; trends: Trend[]; metrics: Metric[]; adaptation: string; course: string
  connected: boolean; factorsOpen: boolean; repair: Repair | null; requests: CoachRequest[]
  latestRun: LatestRun | null; heatmap: boolean
}
export type ExerciseAction = 'rest' | 'post' | 'abc'
export interface TrainingRow { label: string; text: string; action?: ExerciseAction; strength?: Strength | true }
export interface Training { meta: string; rows: TrainingRow[]; tips: string[]; calendar?: boolean }
export interface TodayViewModel extends TodayInput {
  greeting: string; dateLabel: string; title: string; subtitle: string; original: string; completed: string
  status: { label: string; className: string }; training: Training
  briefing: { color: string; heading: string; subtitle: string; verdict: string; source: string; summary: string; tone: Tone }
}
export interface TodayActions {
  info(key: string): void
  chart(key: string): void
  exercise(action: ExerciseAction): void
  strength(session: 'A' | 'B', sets: number): void
  navigate(tab: 'cal' | 'set'): void
  run(id: string): void
  factors(open: boolean): void
  repair(action: 'apply' | 'dismiss' | 'undo'): void
  answer(request: CoachRequest, accept: boolean): Promise<void>
  mountHeatmap(): () => void
  refreshHeatmap(): void
}
