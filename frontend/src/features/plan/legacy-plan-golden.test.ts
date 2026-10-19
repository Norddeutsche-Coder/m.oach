// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeLegacyApp } from '../../legacy/app.js'
import { addD, iso, mon, parse } from '../../lib/format'
import { makeState, setFixedSystemTime } from '../../test/fixtures'

type PlanDay = {
  t: string
  lab: string
  km: number
  d: string
}

type Paces = {
  mp: number
  e1: number
  e2: number
  t: number
  i: number
  r: number
}

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
  tune?: Array<{ id: string; d: string; km: number; m: string; n: string }>
}

type PlanState = ReturnType<typeof makeState> & Record<string, unknown>

type PlanGoldenMasterApi = {
  setState(state: PlanState): void
  plan(date: Date, noAdaptation?: boolean): PlanDay | null
  Z(date: Date): Paces
  ph(weeksToRace: number): string
  vol(weeksToRace: number): number
  progn(): unknown
  wzState(input: WizardInput): Partial<PlanState> & { start: string; race: string }
  wtr(date: Date): number
}

type GoldenRuntime = {
  __planGoldenMaster?: PlanGoldenMasterApi
  dispose?: () => void
}

type Scenario = {
  name: string
  state: PlanState | ((api: PlanGoldenMasterApi) => PlanState)
}

const REQUIRED_DAY_FIELDS = ['type', 'label', 'km', 'description', 'phase']
const REQUIRED_PACE_FIELDS = ['mp', 'e1', 'e2', 't', 'i', 'r']

const wizardInput = (overrides: Partial<WizardInput> = {}): WizardInput => ({
  type: 'race',
  rd: 42.195,
  race: '2027-04-18',
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
  q: 1,
  start: '2026-10-19',
  tp: 3,
  ...overrides,
})

const wizardState = (api: PlanGoldenMasterApi, overrides: Partial<WizardInput>): PlanState =>
  makeState(api.wzState(wizardInput(overrides))) as PlanState

const scenarios: Scenario[] = [
  {
    name: 'Standardplan',
    state: makeState({ start: '2026-10-19', race: '2027-09-26' }) as PlanState,
  },
  {
    name: 'Assistent · Marathon',
    state: (api) => wizardState(api, {}),
  },
  {
    name: 'Assistent · Halbmarathon',
    state: (api) =>
      wizardState(api, {
        rd: 21.0975,
        race: '2027-03-28',
        gh: 1,
        gm: 42,
        peak: 65,
        cap: 24,
      }),
  },
  {
    name: 'Assistent · 10 km',
    state: (api) =>
      wizardState(api, {
        rd: 10,
        race: '2027-02-28',
        gh: 0,
        gm: 44,
        peak: 55,
        cap: 20,
      }),
  },
  {
    name: 'Assistent · 5 km',
    state: (api) =>
      wizardState(api, {
        rd: 5,
        race: '2027-02-07',
        gh: 0,
        gm: 21,
        peak: 45,
        cap: 16,
      }),
  },
  {
    name: 'Erhaltungsplan',
    state: (api) =>
      wizardState(api, {
        type: 'maintain',
        weeks: 16,
        cur: 45,
        peak: 45,
        q: 1,
      }),
  },
  {
    name: 'Eingetragenes Wettkampfergebnis',
    state: makeState({
      start: '2026-10-19',
      race: '2027-04-18',
      res: [{ d: '2026-10-11', km: 10, sec: 2_760 }],
    }) as PlanState,
  },
  {
    name: 'Verschiebung plus Vorbereitungswettkampf',
    state: {
      ...makeState({ start: '2026-10-19', race: '2027-04-18' }),
      mv: {
        '2026-10-20': '2026-10-21',
        '2026-10-21': '2026-10-20',
      },
      tune: [
        {
          id: 'tune-hm',
          d: '2027-03-14',
          km: 21.0975,
          m: 'a',
          n: 'Frühjahrs-Halbmarathon',
        },
      ],
    } as PlanState,
  },
  {
    name: 'Assistent · wenig Umfang · Spitze 30 km',
    state: (api) =>
      wizardState(api, {
        cur: 20,
        peak: 30,
        cap: 28,
        q: 1,
        race: '2027-03-28',
      }),
  },
]

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

function countDays(start: string, race: string): number {
  let count = 0
  for (let date = parse(start); date <= parse(race); date = addD(date, 1)) count += 1
  return count
}

function captureScenario(api: PlanGoldenMasterApi, scenario: Scenario) {
  const state = typeof scenario.state === 'function' ? scenario.state(api) : scenario.state
  const start = String(state.start)
  const race = String(state.race)
  api.setState(state)

  const days: Record<
    string,
    { type: string; label: string; km: number; description: string; phase: string }
  > = {}
  for (let date = parse(start); date <= parse(race); date = addD(date, 1)) {
    const planned = api.plan(date, true)
    expect(planned, `${scenario.name}: fehlender Trainingstag ${iso(date)}`).not.toBeNull()
    days[iso(date)] = {
      type: planned!.t,
      label: planned!.lab,
      km: planned!.km,
      description: planned!.d,
      phase: api.ph(api.wtr(date)),
    }
  }

  const weeks: Record<string, Paces> = {}
  for (let week = mon(parse(start)); week <= parse(race); week = addD(week, 7)) {
    weeks[iso(week)] = api.Z(week)
  }

  return { name: scenario.name, start, race, days, weeks }
}

describe('Legacy-Trainingspläne als Golden Master', () => {
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

  it('sichert genau neun vollständige Planszenarien', () => {
    runtime = initializeLegacyApp({
      onTabChange: () => undefined,
      onCoachChange: () => undefined,
      onTodayChange: () => undefined,
    }) as unknown as GoldenRuntime

    expect(
      runtime.__planGoldenMaster,
      'initializeLegacyApp muss im Testmodus __planGoldenMaster bereitstellen',
    ).toBeDefined()
    const api = runtime.__planGoldenMaster!

    expect(scenarios).toHaveLength(9)
    expect(new Set(scenarios.map((scenario) => scenario.name)).size).toBe(9)

    const captured = scenarios.map((scenario) => captureScenario(api, scenario))
    for (const scenario of captured) {
      expect(Object.keys(scenario.days)).toHaveLength(countDays(scenario.start, scenario.race))
      for (const day of Object.values(scenario.days)) {
        expect(Object.keys(day)).toEqual(REQUIRED_DAY_FIELDS)
      }
      for (const paces of Object.values(scenario.weeks)) {
        expect(Object.keys(paces)).toEqual(REQUIRED_PACE_FIELDS)
      }
    }

    expect(captured).toMatchSnapshot()
  })
})
