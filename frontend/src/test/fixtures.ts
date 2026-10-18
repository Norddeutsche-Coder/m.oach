import { vi } from 'vitest'
import { parse } from '../lib/format'

export interface TestState {
  start: string | null
  runs: unknown[]
  rd: number
  goalT: number | null
  noPlan: boolean
  hist: unknown[]
  race: string
  goal: number
  base: number
  res: unknown[]
  log: Record<string, unknown>
  chk: Record<string, unknown>
  well: Record<string, unknown>
  prof: Record<string, unknown>
}

export function makeState(overrides: Partial<TestState> = {}): TestState {
  return {
    start: null,
    rd: 42.195,
    goalT: null,
    noPlan: false,
    race: '2027-09-26',
    goal: 9900,
    base: 11400,
    ...overrides,
    runs: [...(overrides.runs ?? [])],
    hist: [...(overrides.hist ?? [])],
    res: [...(overrides.res ?? [])],
    log: { ...(overrides.log ?? {}) },
    chk: { ...(overrides.chk ?? {}) },
    well: { ...(overrides.well ?? {}) },
    prof: { ...(overrides.prof ?? {}) },
  }
}

export function day(value: string): Date {
  return parse(value)
}

export function setFixedSystemTime(value: string, hour = 12): () => void {
  const date = day(value)
  date.setHours(hour, 0, 0, 0)
  vi.useFakeTimers()
  vi.setSystemTime(date)

  return () => vi.useRealTimers()
}
