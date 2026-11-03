import { describe, expect, it } from 'vitest'
import { iso } from '../../lib/format'
import { day, makeState } from '../../test/fixtures'
import { histSeg, withPlan } from './history'
import type { PlanConfig, PlanSegment, PlanSegmentInput, TuneRace } from './types'

const segment = (overrides: Partial<PlanSegment> = {}): PlanSegment => ({
  start: '2026-01-05',
  until: '2026-03-01',
  race: '2026-04-26',
  goal: 10_800,
  goalT: null,
  rd: 42.195,
  base: 11_700,
  cfg: null,
  tune: null,
  ...overrides,
})

const winter = segment()
const spring = segment({ start: '2026-03-02', until: '2026-06-28', race: '2026-06-28' })
const overlap = segment({ start: '2026-02-01', until: '2026-03-15', race: '2026-03-15' })

const cfg = { tw: 12, mode: 'maintain' } as unknown as PlanConfig
const tune: TuneRace[] = [{ id: 'tune-hm', d: '2026-05-10', km: 21.0975, m: 'a', n: 'Testlauf' }]

describe('histSeg', () => {
  it('findet den früheren Planabschnitt, in dem das Datum liegt', () => {
    const history = [winter, spring]

    expect(histSeg(history, day('2026-02-10'))).toBe(winter)
    expect(histSeg(history, day('2026-04-15'))).toBe(spring)
  })

  it('zählt den ersten und letzten Tag eines Abschnitts dazu', () => {
    const history = [winter]

    expect(histSeg(history, day('2026-01-05'))).toBe(winter)
    expect(histSeg(history, day('2026-03-01'))).toBe(winter)
  })

  it('zählt den Tag vor dem Start und nach dem Ende nicht dazu', () => {
    const history = [winter]

    expect(histSeg(history, day('2026-01-04'))).toBeNull()
    expect(histSeg(history, day('2026-03-02'))).toBeNull()
  })

  it('wechselt am Übergang zweier Abschnitte genau am Starttag des neuen Abschnitts', () => {
    const history = [winter, spring]

    expect(histSeg(history, day('2026-03-01'))).toBe(winter)
    expect(histSeg(history, day('2026-03-02'))).toBe(spring)
  })

  it('nimmt bei überlappenden Abschnitten den späteren Eintrag im Array', () => {
    expect(histSeg([winter, overlap], day('2026-02-15'))).toBe(overlap)
    expect(histSeg([overlap, winter], day('2026-02-15'))).toBe(winter)
    // Outside the overlap the only matching segment still wins.
    expect(histSeg([winter, overlap], day('2026-01-20'))).toBe(winter)
    expect(histSeg([winter, overlap], day('2026-03-10'))).toBe(overlap)
  })

  it('liefert null für ein Datum außerhalb jeder Historie', () => {
    const history = [winter, spring]

    expect(histSeg(history, day('2025-12-31'))).toBeNull()
    expect(histSeg(history, day('2026-06-29'))).toBeNull()
  })

  it('liefert null ohne Historie', () => {
    expect(histSeg([], day('2026-02-10'))).toBeNull()
    expect(histSeg(undefined, day('2026-02-10'))).toBeNull()
    expect(histSeg(null, day('2026-02-10'))).toBeNull()
  })

  it('verändert die Historie nicht', () => {
    const history = [winter, overlap, spring]
    const before = structuredClone(history)

    histSeg(history, day('2026-02-15'))

    expect(history).toEqual(before)
  })
})

describe('withPlan', () => {
  const currentState = () => ({
    ...makeState({
      start: '2026-10-19',
      race: '2027-04-18',
      goal: 12_000,
      goalT: 5_400,
      rd: 21.0975,
      base: 12_600,
      noPlan: true,
      hist: [winter, spring],
      log: { '2026-02-10': { done: true, km: 8 } },
      res: [{ d: '2026-01-25', km: 10, sec: 2_700 }],
    }),
    cfg: { tw: 26 } as unknown as PlanConfig,
    tune: [{ id: 'tune-10', d: '2027-03-01', km: 10, m: 'b', n: 'Aktuell' }] as TuneRace[],
    wkadj: { '2026-10-19': 0.9 },
  })

  const minimalPlan: PlanSegmentInput = {
    start: '2026-01-05',
    race: '2026-04-26',
    goal: 10_800,
    base: 11_700,
  }

  it('übergibt eine Kopie mit den Feldern des Abschnitts und Standardwerten', () => {
    const state = currentState()

    withPlan(state, minimalPlan, (copy, start) => {
      expect(copy).not.toBe(state)
      expect(copy).toMatchObject({
        race: '2026-04-26',
        goal: 10_800,
        goalT: null,
        rd: 42.195,
        base: 11_700,
        start: '2026-01-05',
        cfg: null,
        tune: null,
        noPlan: false,
      })
      expect(iso(start)).toBe('2026-01-05')
      expect(start.getHours()).toBe(0)
    })
  })

  it('übernimmt gesetzte Werte des Abschnitts', () => {
    const state = currentState()
    const plan: PlanSegmentInput = { ...minimalPlan, goalT: 6_000, rd: 21.0975, cfg, tune }

    withPlan(state, plan, (copy) => {
      expect(copy.goalT).toBe(6_000)
      expect(copy.rd).toBe(21.0975)
      expect(copy.cfg).toBe(cfg)
      expect(copy.tune).toBe(tune)
    })
  })

  it('behält die übrigen Felder des Zustands in der Kopie', () => {
    const state = currentState()

    withPlan(state, minimalPlan, (copy) => {
      expect(copy.log).toEqual(state.log)
      expect(copy.hist).toEqual(state.hist)
      expect(copy.res).toEqual(state.res)
      expect(copy.wkadj).toEqual(state.wkadj)
      expect(copy.prof).toEqual(state.prof)
    })
  })

  it('nimmt ohne Planstart den 12.10.2026 als Startdatum', () => {
    const state = currentState()
    const withoutStart = { ...minimalPlan, start: undefined } as unknown as PlanSegmentInput

    withPlan(state, withoutStart, (_copy, start) => {
      expect(iso(start)).toBe('2026-10-12')
    })
    withPlan(state, { ...minimalPlan, start: '' }, (_copy, start) => {
      expect(iso(start)).toBe('2026-10-12')
    })
  })

  it('gibt das Ergebnis von run zurück', () => {
    const state = currentState()

    const result = withPlan(state, minimalPlan, (copy, start) => ({
      race: copy.race,
      start: iso(start),
    }))

    expect(result).toEqual({ race: '2026-04-26', start: '2026-01-05' })
  })

  it('lässt den Zustand unverändert', () => {
    const state = currentState()
    const before = structuredClone(state)

    withPlan(state, { ...minimalPlan, cfg, tune }, () => 1)

    expect(state).toEqual(before)
  })

  it('lässt den Zustand unverändert, wenn run die Kopie verändert', () => {
    const state = currentState()
    const before = structuredClone(state)

    withPlan(state, minimalPlan, (copy) => {
      copy.race = '2030-01-01'
      copy.goal = 1
      copy.noPlan = true
      copy.start = '2030-01-01'
      copy.log = {}
      copy.hist = []
    })

    expect(state).toEqual(before)
  })

  it('reicht einen Fehler aus run weiter und lässt den Zustand unverändert', () => {
    const state = currentState()
    const before = structuredClone(state)

    expect(() =>
      withPlan(state, minimalPlan, (copy) => {
        copy.race = '2030-01-01'
        throw new Error('Plan kaputt')
      }),
    ).toThrow('Plan kaputt')
    expect(state).toEqual(before)
  })
})
