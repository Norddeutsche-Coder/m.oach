import { iso, parse } from '../../lib/format'
import type { PlanFields, PlanSegment, PlanSegmentInput } from './types'

const DEFAULT_START = '2026-10-12'

/** Archived plan segment containing the date (bounds inclusive); the later entry wins. */
export function histSeg(
  history: readonly PlanSegment[] | null | undefined,
  date: Date,
): PlanSegment | null {
  const key = iso(date)
  const list = history || []
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].start <= key && key <= list[i].until) return list[i]
  }
  return null
}

/** Runs `run` with a copy of the state that carries the plan fields, leaving `state` untouched. */
export function withPlan<S extends PlanFields, R>(
  state: S,
  plan: PlanSegmentInput,
  run: (state: S, start: Date) => R,
): R {
  const copy: S = {
    ...state,
    race: plan.race,
    goal: plan.goal,
    goalT: plan.goalT || null,
    rd: plan.rd || 42.195,
    base: plan.base,
    start: plan.start,
    cfg: plan.cfg || null,
    tune: plan.tune || null,
    noPlan: false,
  }
  return run(copy, parse(plan.start || DEFAULT_START))
}
