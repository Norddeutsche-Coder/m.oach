// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeLegacyApp } from '../../legacy/app.js'
import { addD, iso, parse } from '../../lib/format'
import { makeState, setFixedSystemTime } from '../../test/fixtures'

type PlanDay = { t: string; lab: string; km: number; d: string }

type Paces = { mp: number; e1: number; e2: number; t: number; i: number; r: number }

type WizardInput = {
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
}

type PlanState = ReturnType<typeof makeState> & Record<string, unknown>

type WizardPlan = Partial<PlanState> & { start: string; race: string }

type PlanGoldenMasterApi = {
  setState(state: PlanState): void
  plan(date: Date, noAdaptation?: boolean): PlanDay | null
  Z(date: Date): Paces
  wzState(input: WizardInput): WizardPlan
  wtr(date: Date): number
}

type GoldenRuntime = {
  __planGoldenMaster?: PlanGoldenMasterApi
  dispose?: () => void
}

const appShell = `
  <header><div id="cd"></div><button id="sy"></button><button id="pf"></button></header>
  <main>
    <section id="today"></section><section id="cal"></section><section id="runs"></section>
    <section id="perf"></section><section id="race"></section><section id="set"></section>
    <section id="coach"></section><div id="rv" hidden></div><div id="md" hidden></div>
    <div id="im" hidden></div>
  </main>
  <div id="cm" hidden></div><div id="wz" hidden></div><div id="auth" hidden></div>
  <nav class="dock">
    <button data-t="today"></button><button data-t="cal"></button><button data-t="runs"></button>
    <button data-t="perf"></button><button data-t="race"></button><button data-t="set"></button>
    <button data-t="coach"></button>
  </nav>
`

const wizardInput = (overrides: Partial<WizardInput> = {}): WizardInput => ({
  type: 'race',
  rd: 42.195,
  race: '2026-09-27',
  gh: 3,
  gm: 30,
  gs: 0,
  weeks: 12,
  rk: 10,
  rh: 0,
  rm: 48,
  rs: 0,
  cur: 50,
  peak: 80,
  cap: 32,
  rest: [0],
  lg: 6,
  str: 2,
  q: 2,
  start: '2026-04-06',
  tp: 3,
  ...overrides,
})

// Earlier plans X, both ending before the current plan Y starts on 2026-10-19.
const earlierPlans: Array<{ name: string; input: Partial<WizardInput>; until: string }> = [
  { name: 'Wettkampfplan', input: {}, until: '2026-10-18' },
  {
    name: 'Erhaltungsplan',
    input: { type: 'maintain', start: '2026-06-03', weeks: 16, cur: 45, peak: 45 },
    until: '2026-10-18',
  },
]

function daysBetween(start: string, end: string): Date[] {
  const days: Date[] = []
  for (let date = parse(start); date <= parse(end); date = addD(date, 1)) days.push(date)
  return days
}

function record(api: PlanGoldenMasterApi, days: Date[]): Record<string, PlanDay | null> {
  return Object.fromEntries(days.map((date) => [iso(date), api.plan(date, true)]))
}

describe('Legacy-Plan-Historie', () => {
  let runtime: GoldenRuntime | undefined
  let restoreTime: (() => void) | undefined

  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    document.body.innerHTML = appShell
    localStorage.clear()
    localStorage.setItem('moach_users', JSON.stringify([{ id: 'golden', name: 'Golden Master' }]))
    localStorage.setItem('moach_cur', 'golden')
    localStorage.setItem(
      'moach_sb',
      JSON.stringify({
        url: 'https://test-project.supabase.co',
        key: 'sb_publishable_test_only_000000000000',
      }),
    )
    restoreTime = setFixedSystemTime('2026-10-19')
  })

  afterEach(() => {
    runtime?.dispose?.()
    runtime = undefined
    restoreTime?.()
    restoreTime = undefined
    localStorage.clear()
    document.body.innerHTML = ''
  })

  function legacyApi(): PlanGoldenMasterApi {
    runtime = initializeLegacyApp({
      onTabChange: () => undefined,
      onCoachChange: () => undefined,
      onTodayChange: () => undefined,
    }) as unknown as GoldenRuntime

    expect(runtime.__planGoldenMaster).toBeDefined()
    return runtime.__planGoldenMaster!
  }

  function earlierPlan(api: PlanGoldenMasterApi, input: Partial<WizardInput>, until: string) {
    const current = api.wzState(wizardInput(input))
    return { current, segment: { ...current, until } }
  }

  function currentPlanY(api: PlanGoldenMasterApi): WizardPlan {
    return api.wzState(
      wizardInput({ start: '2026-10-19', race: '2027-04-18', gh: 3, gm: 20, peak: 85, cap: 33 }),
    )
  }

  it.each(earlierPlans)(
    'plant einen archivierten $name genauso wie als aktueller Plan',
    ({ input, until }) => {
      const api = legacyApi()
      const { current, segment } = earlierPlan(api, input, until)
      const days = daysBetween(current.start, until)

      api.setState(makeState(current) as PlanState)
      const asCurrent = record(api, days)
      expect(Object.values(asCurrent).some((planned) => planned && planned.km > 0)).toBe(true)

      api.setState(makeState({ noPlan: true, hist: [segment] }) as PlanState)
      expect(record(api, days)).toEqual(asCurrent)
    },
  )

  it.each(earlierPlans)(
    'liefert nach einem $name die alten Tage aus der Historie, ohne den aktuellen Plan zu verändern',
    ({ input, until }) => {
      const api = legacyApi()
      const { current: x, segment } = earlierPlan(api, input, until)
      const y = currentPlanY(api)
      const xDays = daysBetween(x.start, until)
      const yDays = daysBetween(y.start, y.race)

      api.setState(makeState(x) as PlanState)
      const xAsCurrent = record(api, xDays)

      api.setState(makeState({ ...y, hist: [segment] }) as PlanState)
      const yBefore = record(api, yDays)
      const wtrBefore = yDays.map((date) => api.wtr(date))
      const zonesBefore = yDays.map((date) => api.Z(date))

      expect(record(api, xDays)).toEqual(xAsCurrent)

      expect(record(api, yDays)).toEqual(yBefore)
      expect(yDays.map((date) => api.wtr(date))).toEqual(wtrBefore)
      expect(yDays.map((date) => api.Z(date))).toEqual(zonesBefore)
    },
  )

  it('liefert ohne aktuellen Plan null für Tage außerhalb jeder Historie', () => {
    const api = legacyApi()
    const { segment } = earlierPlan(api, {}, '2026-10-18')

    api.setState(makeState({ noPlan: true, hist: [segment] }) as PlanState)

    expect(api.plan(parse('2026-04-05'), true)).toBeNull()
    expect(api.plan(parse('2026-10-19'), true)).toBeNull()
    expect(api.plan(parse('2027-01-11'), true)).toBeNull()
    expect(api.plan(parse('2026-04-06'), true)).not.toBeNull()
  })
})
