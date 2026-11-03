import { describe, expect, it, vi } from 'vitest'
import { addD, iso, parse } from '../../lib/format'
import type { PaceZones } from '../plan/types'
import { analyzeRun, runKind } from './analysis'
import type { PlannedRun, Run, RunContext } from './types'

// Wednesday 2026-04-08. The 42-day look-back (back to 2026-02-25) crosses the
// European daylight-saving change on 2026-03-29.
const DAY = '2026-04-08'
const daysBefore = (n: number) => iso(addD(parse(DAY), -n))

// Default: 10 km in 55:00, i.e. 5:30 /km.
const run = (overrides: Partial<Run> = {}): Run => ({ d: DAY, km: 10, sec: 3300, ...overrides })

const ctx = (overrides: Partial<RunContext> = {}): RunContext => ({
  runs: [],
  hrmax: null,
  pf: null,
  zones: null,
  med: null,
  mkm: null,
  k80: null,
  ...overrides,
})

const planned = (day: PlannedRun | null) => () => day

// Easy zone 5:00–5:30 /km.
const zones = (): PaceZones => ({ mp: 270, e1: 300, e2: 330, t: 255, i: 235, r: 220 })

const DEFAULT_GOOD = 'Lauf absolviert. Konstanz zählt.'
const DEFAULT_NEXT_EASY = 'Weiter so. Die nächste Einheit wie geplant.'

describe('runKind', () => {
  it('uses the planned type when the plan day has a distance and is a run type', () => {
    const c = ctx({ k80: 10, med: 300 })

    expect(runKind(run({ km: 20 }), c, { t: 'q', km: 10 })).toBe('q')
    expect(runKind(run(), c, { t: 'long', km: 25 })).toBe('long')
    expect(runKind(run(), c, { t: 'race', km: 42.2 })).toBe('race')
    expect(runKind(run({ km: 20 }), c, { t: 'easy', km: 8 })).toBe('easy')
  })

  it('ignores the plan day when it has no distance, is a rest day or no run type', () => {
    const c = ctx({ k80: 20 })
    const long = run({ km: 19 })

    expect(runKind(long, c, { t: 'easy' })).toBe('long')
    expect(runKind(long, c, { t: 'easy', km: 0 })).toBe('long')
    expect(runKind(long, c, { t: 'rest', km: 10 })).toBe('long')
    expect(runKind(long, c, { t: 'str', km: 10 })).toBe('long')
    expect(runKind(long, c, null)).toBe('long')
  })

  it('detects a long run from 95 % of the k80 distance', () => {
    const c = ctx({ k80: 20 })

    expect(runKind(run({ km: 19 }), c, null)).toBe('long')
    expect(runKind(run({ km: 18.9 }), c, null)).toBe('easy')
  })

  it('needs at least 14 km for a long run', () => {
    const c = ctx({ k80: 10 })

    expect(runKind(run({ km: 14 }), c, null)).toBe('long')
    expect(runKind(run({ km: 13.9 }), c, null)).toBe('easy')
  })

  it('detects a quality run below 93 % of the median pace from 4 km', () => {
    const c = ctx({ med: 300 })

    expect(runKind(run({ km: 10, sec: 2789 }), c, null)).toBe('q')
    expect(runKind(run({ km: 10, sec: 2790 }), c, null)).toBe('easy')
    expect(runKind(run({ km: 4, sec: 1100 }), c, null)).toBe('q')
    expect(runKind(run({ km: 3.9, sec: 1000 }), c, null)).toBe('easy')
  })

  it('falls back to easy without pace, median or k80', () => {
    expect(runKind(run(), ctx(), null)).toBe('easy')
    expect(runKind(run({ sec: 0 }), ctx({ med: 300 }), null)).toBe('easy')
    expect(runKind(run({ km: 0, sec: 0 }), ctx({ med: 300, k80: 20 }), null)).toBe('easy')
  })
})

describe('analyzeRun without pace, heart rate or plan', () => {
  it('returns only the default statements and does not throw', () => {
    const a = analyzeRun(run({ sec: 0 }), ctx())

    expect(a).toEqual({
      kind: 'easy',
      good: [DEFAULT_GOOD],
      bad: [],
      nxt: [DEFAULT_NEXT_EASY],
      note: [],
      v: { t: 'Stark', c: 'g' },
      pc: null,
    })
  })

  it('tolerates a run without distance and with heart rate, effort and elevation', () => {
    const a = analyzeRun(run({ km: 0, sec: 0, hr: 150, rpe: 5, el: 100 }), ctx())

    expect(a.pc).toBeNull()
    expect(a.bad).toEqual([])
    expect(a.note).toEqual([])
    expect(a.good).toEqual([DEFAULT_GOOD])
  })

  it('makes no pace or heart rate statement without zones, median and maximum heart rate', () => {
    const a = analyzeRun(run({ sec: 2400, hr: 190 }), ctx({ pf: planned(null) }))

    expect(a.bad).toEqual([])
    expect(a.good).toEqual([DEFAULT_GOOD])
  })

  it('reports the pace in seconds per km', () => {
    expect(analyzeRun(run({ km: 10, sec: 3000 }), ctx()).pc).toBe(300)
    expect(analyzeRun(run({ km: 0, sec: 3000 }), ctx()).pc).toBeNull()
  })

  it('uses a manual-entry text as default praise for manual runs', () => {
    expect(analyzeRun(run({ manual: true }), ctx()).good).toEqual([
      'Lauf eingetragen. Konstanz zählt.',
    ])
  })
})

describe('analyzeRun pace of easy runs with zones', () => {
  it('asks the zones and the plan for the date of the run', () => {
    const zoneLookup = vi.fn<(date: Date) => PaceZones>(zones)
    const planLookup = vi.fn<(date: Date) => PlannedRun | null>(planned(null))

    analyzeRun(run(), ctx({ zones: zoneLookup, pf: planLookup }))

    expect(iso(zoneLookup.mock.calls[0][0])).toBe(DAY)
    expect(iso(planLookup.mock.calls[0][0])).toBe(DAY)
  })

  it('accepts a pace exactly at 97 % of the lower easy bound', () => {
    const a = analyzeRun(run({ sec: 2910 }), ctx({ zones }))

    expect(a.good).toEqual(['Tempo im lockeren Bereich (4:51 /km)'])
    expect(a.bad).toEqual([])
  })

  it('flags a pace just below 97 % of the lower easy bound as too fast', () => {
    const a = analyzeRun(run({ sec: 2909 }), ctx({ zones }))

    expect(a.bad).toEqual([
      { k: 'fast', t: 'Zu schnell für einen lockeren Lauf: 4:51 statt 5:00–5:30 /km' },
    ])
    expect(a.nxt).toEqual(['Die ersten 3 km bewusst langsamer, im Gesprächstempo bleiben.'])
    expect(a.v).toEqual({ t: 'Gut', c: 'y' })
  })

  it('makes no pace statement for runs that are not easy', () => {
    const a = analyzeRun(run({ sec: 2500 }), ctx({ zones, pf: planned({ t: 'q', km: 10 }) }))

    expect(a.kind).toBe('q')
    expect(a.bad).toEqual([])
    expect(a.good).toEqual(['Umfang wie geplant (10 von 10 km)'])
  })
})

describe('analyzeRun pace of easy runs without zones', () => {
  it('flags a pace below 95 % of the median as too fast', () => {
    const a = analyzeRun(run({ sec: 2849 }), ctx({ med: 300 }))

    expect(a.kind).toBe('easy')
    expect(a.bad).toEqual([
      { k: 'fast', t: 'Schneller als dein üblicher Schnitt (4:45 statt 5:00 /km)' },
    ])
    expect(a.nxt).toEqual(['Lockere Läufe bewusst langsam beginnen.'])
  })

  it('makes no statement exactly at 95 % of the median', () => {
    const a = analyzeRun(run({ sec: 2850 }), ctx({ med: 300 }))

    expect(a.bad).toEqual([])
    expect(a.good).toEqual([DEFAULT_GOOD])
  })
})

describe('analyzeRun volume compared with the plan', () => {
  const c = ctx({ pf: planned({ t: 'easy', km: 10 }) })

  it('praises 90 % to 110 % of the planned distance', () => {
    expect(analyzeRun(run({ km: 9 }), c).good).toEqual(['Umfang wie geplant (9 von 10 km)'])
    expect(analyzeRun(run({ km: 9.5 }), c).good).toEqual(['Umfang wie geplant (9,5 von 10 km)'])
    expect(analyzeRun(run({ km: 11 }), c).good).toEqual(['Umfang wie geplant (11 von 10 km)'])
  })

  it('makes no statement between 110 % and 115 % or between 80 % and 90 %', () => {
    for (const km of [11.2, 11.5, 8, 8.9]) {
      const a = analyzeRun(run({ km }), c)
      expect(a.bad).toEqual([])
      expect(a.good).toEqual([DEFAULT_GOOD])
    }
  })

  it('flags more than 115 % of the planned distance as too long', () => {
    const a = analyzeRun(run({ km: 11.6 }), c)

    expect(a.bad).toEqual([{ k: 'long', t: 'Länger als geplant: 11,6 statt 10 km' }])
    expect(a.nxt).toEqual(['Den geplanten Umfang einhalten. Mehr bringt nicht automatisch mehr.'])
  })

  it('flags less than 80 % of the planned distance as shortened', () => {
    const a = analyzeRun(run({ km: 7.9 }), c)

    expect(a.bad).toEqual([{ k: 'short', t: 'Gekürzt: nur 7,9 von 10 km' }])
    expect(a.nxt).toEqual([
      'Wenn du kürzen musst, lieber einen lockeren Lauf auslassen als die Qualität.',
    ])
  })

  it('makes no volume statement without a planned distance', () => {
    expect(analyzeRun(run({ km: 20 }), ctx({ pf: planned({ t: 'easy' }) })).bad).toEqual([])
    expect(analyzeRun(run({ km: 20 }), ctx({ pf: planned(null) })).bad).toEqual([])
  })
})

describe('analyzeRun on a planned rest day', () => {
  it('flags the run and makes no volume statement', () => {
    for (const day of [{ t: 'rest' }, { t: 'rest', km: 10 }]) {
      const a = analyzeRun(run({ km: 30 }), ctx({ pf: planned(day) }))

      expect(a.kind).toBe('easy')
      expect(a.bad).toEqual([{ k: 'rest', t: 'Lauf an einem geplanten Ruhetag' }])
      expect(a.nxt).toEqual(['Ruhetage einhalten: Dort passiert die Anpassung.'])
      expect(a.v).toEqual({ t: 'Gut', c: 'y' })
    }
  })
})

describe('analyzeRun heart rate', () => {
  const easy = ctx({ hrmax: 200 })
  const quality = ctx({ hrmax: 200, pf: planned({ t: 'q', km: 10 }) })

  it('praises an easy run at up to 76 % of the maximum heart rate', () => {
    expect(analyzeRun(run({ hr: 152 }), easy).good).toEqual([
      'Puls entspannt (76 % der höchsten gemessenen Frequenz)',
    ])
  })

  it('makes no statement for an easy run between 76 % and 83 %', () => {
    for (const hr of [154, 164]) {
      const a = analyzeRun(run({ hr }), easy)
      expect(a.bad).toEqual([])
      expect(a.good).toEqual([DEFAULT_GOOD])
    }
  })

  it('flags an easy run from 83 % of the maximum heart rate', () => {
    const a = analyzeRun(run({ hr: 166 }), easy)

    expect(a.bad).toEqual([
      { k: 'hr', t: 'Puls hoch für einen lockeren Lauf (83 % der höchsten Frequenz)' },
    ])
    expect(a.nxt).toEqual([
      'Langsamer starten. Hitze, Müdigkeit, Koffein und Stress treiben den Puls.',
    ])
  })

  it('praises a quality run from 82 % of the maximum heart rate', () => {
    expect(analyzeRun(run({ hr: 164 }), quality).good).toEqual([
      'Umfang wie geplant (10 von 10 km)',
      'Intensität passend: Ø Puls 82 % der höchsten Frequenz',
    ])
    expect(analyzeRun(run({ hr: 162 }), quality).good).toEqual([
      'Umfang wie geplant (10 von 10 km)',
    ])
  })

  it('makes no heart rate statement for long runs', () => {
    const a = analyzeRun(run({ hr: 190 }), ctx({ hrmax: 200, pf: planned({ t: 'long', km: 10 }) }))

    expect(a.bad).toEqual([])
    expect(a.good).toEqual(['Umfang wie geplant (10 von 10 km)'])
  })
})

describe('analyzeRun perceived effort', () => {
  const quality = ctx({ pf: planned({ t: 'q', km: 10 }) })

  it('flags an easy run from effort 7', () => {
    const a = analyzeRun(run({ rpe: 7 }), ctx())

    expect(a.bad).toEqual([{ k: 'rpe', t: 'Anstrengung 7/10 ist für einen lockeren Lauf zu hoch' }])
    expect(a.nxt).toEqual(['Gefühl über Tempo stellen: lockere Läufe dürfen sich leicht anfühlen.'])
  })

  it('flags effort 9 on an easy run only as too high for an easy run', () => {
    expect(analyzeRun(run({ rpe: 9 }), ctx()).bad).toEqual([
      { k: 'rpe', t: 'Anstrengung 9/10 ist für einen lockeren Lauf zu hoch' },
    ])
  })

  it('makes no statement for an easy run with effort 5 or 6', () => {
    for (const rpe of [5, 6]) {
      const a = analyzeRun(run({ rpe }), ctx())
      expect(a.bad).toEqual([])
      expect(a.good).toEqual([DEFAULT_GOOD])
    }
  })

  it('praises an easy run up to effort 4', () => {
    expect(analyzeRun(run({ rpe: 4 }), ctx()).good).toEqual(['Locker gelaufen (Anstrengung 4/10)'])
    expect(analyzeRun(run({ rpe: 1 }), ctx()).good).toEqual(['Locker gelaufen (Anstrengung 1/10)'])
  })

  it('flags other runs from effort 9 as very hard', () => {
    const a = analyzeRun(run({ rpe: 9 }), quality)

    expect(a.bad).toEqual([{ k: 'rpe', t: 'Sehr hart (Anstrengung 9/10)' }])
    expect(a.nxt).toEqual(['Danach ein lockerer oder freier Tag.'])
  })

  it('makes no statement for other runs below effort 9 or without effort', () => {
    expect(analyzeRun(run({ rpe: 8 }), quality).bad).toEqual([])
    expect(analyzeRun(run({ rpe: 3 }), quality).good).toEqual(['Umfang wie geplant (10 von 10 km)'])
    expect(analyzeRun(run({ rpe: 0 }), ctx()).good).toEqual([DEFAULT_GOOD])
  })
})

describe('analyzeRun efficiency against the previous 42 days', () => {
  // Every other day, so that no streak builds up. Pace 5:00 /km at heart rate 150.
  const base = (days: readonly number[]): Run[] =>
    days.map((n) => ({ d: daysBefore(n), km: 10, sec: 3000, hr: 150 }))
  const four = ctx({ runs: base([2, 4, 6, 8]) })
  const current = (hr: number) => run({ sec: 3000, hr })

  it('praises an efficiency gain of at least 2.5 %', () => {
    expect(analyzeRun(current(146), four).good).toEqual([
      'Effizienter als dein Schnitt: +2,7 % Tempo pro Herzschlag',
    ])
  })

  it('makes no statement between −5 % and +2.5 %', () => {
    for (const hr of [147, 150, 157.8]) {
      const a = analyzeRun(current(hr), four)
      expect(a.bad).toEqual([])
      expect(a.good).toEqual([DEFAULT_GOOD])
    }
  })

  it('flags an efficiency loss of at least 5 %', () => {
    expect(analyzeRun(current(157.9), four).bad).toEqual([
      { k: 'eff', t: 'Weniger effizient als sonst (−5,0 % Tempo pro Herzschlag)' },
    ])
    const a = analyzeRun(current(165), four)
    expect(a.bad).toEqual([
      { k: 'eff', t: 'Weniger effizient als sonst (−9,1 % Tempo pro Herzschlag)' },
    ])
    expect(a.nxt).toEqual([
      'Schlaf, Hitze und Flüssigkeit prüfen. Hängt es an, die Woche entschärfen.',
    ])
  })

  it('includes a run exactly 42 days before and excludes one 43 days before', () => {
    expect(analyzeRun(current(165), ctx({ runs: base([2, 4, 6, 42]) })).bad).toHaveLength(1)
    expect(analyzeRun(current(165), ctx({ runs: base([2, 4, 6, 43]) })).bad).toEqual([])
  })

  it('ignores the run day, later days and runs without heart rate or below 4 km', () => {
    const runs = [
      ...base([2, 4, 6]),
      { d: DAY, km: 10, sec: 3000, hr: 150 },
      { d: '2026-04-09', km: 10, sec: 3000, hr: 150 },
      { d: daysBefore(8), km: 10, sec: 3000 },
      { d: daysBefore(10), km: 3.9, sec: 1170, hr: 150 },
      { d: daysBefore(12), km: 10, sec: 0, hr: 150 },
    ]

    expect(analyzeRun(current(165), ctx({ runs })).bad).toEqual([])
  })

  it('needs heart rate, pace and at least 4 km on the analysed run', () => {
    expect(analyzeRun(run({ sec: 3000 }), four).bad).toEqual([])
    expect(analyzeRun(run({ sec: 0, hr: 165 }), four).bad).toEqual([])
    expect(analyzeRun(run({ km: 3.9, sec: 1170, hr: 165 }), four).bad).toEqual([])
  })
})

describe('analyzeRun training load', () => {
  const withLoad = (days: readonly number[]) =>
    ctx({ runs: days.map((n) => ({ d: daysBefore(n), km: 10, sec: 3300, ld: 100 })) })

  it('flags a load above 1.5 times the mean of at least 4 previous runs', () => {
    const a = analyzeRun(run({ ld: 151 }), withLoad([2, 4, 6, 8]))

    expect(a.bad).toEqual([{ k: 'load', t: 'Hohe Trainingslast (151, Ø 100)' }])
    expect(a.nxt).toEqual(['Danach einen lockeren oder freien Tag einplanen.'])
  })

  it('makes no statement at exactly 1.5 times the mean', () => {
    expect(analyzeRun(run({ ld: 150 }), withLoad([2, 4, 6, 8])).bad).toEqual([])
  })

  it('needs at least 4 previous runs with a load', () => {
    const c = withLoad([2, 4, 6])
    const runs = [...c.runs, { d: daysBefore(8), km: 10, sec: 3300 }]

    expect(analyzeRun(run({ ld: 400 }), ctx({ runs })).bad).toEqual([])
  })
})

describe('analyzeRun running streak', () => {
  const onDays = (days: readonly number[]) =>
    ctx({ runs: days.map((n) => ({ d: daysBefore(n), km: 8, sec: 2800 })) })

  it('flags 5 consecutive previous running days', () => {
    const a = analyzeRun(run(), onDays([1, 2, 3, 4, 5]))

    expect(a.bad).toEqual([{ k: 'streak', t: '6. Lauftag in Folge' }])
    expect(a.nxt).toEqual(['Einen freien Tag einplanen.'])
  })

  it('makes no statement after 4 consecutive previous running days', () => {
    expect(analyzeRun(run(), onDays([1, 2, 3, 4])).bad).toEqual([])
  })

  it('stops counting at the first day without a run', () => {
    expect(analyzeRun(run(), onDays([1, 2, 4, 5, 6, 7])).bad).toEqual([])
  })

  it('counts at most 7 previous days', () => {
    expect(analyzeRun(run(), onDays([1, 2, 3, 4, 5, 6, 7, 8, 9])).bad).toEqual([
      { k: 'streak', t: '8. Lauftag in Folge' },
    ])
  })
})

describe('analyzeRun notes and next steps', () => {
  it('adds a note for hilly runs from 15 m elevation per km', () => {
    const a = analyzeRun(run({ el: 150 }), ctx())

    expect(a.note).toEqual([
      'Hügelig (15 m pro km): Das Tempo ist nicht direkt mit flachen Läufen vergleichbar.',
    ])
    expect(a.v).toEqual({ t: 'Stark', c: 'g' })
    expect(analyzeRun(run({ el: 149 }), ctx()).note).toEqual([])
  })

  it('suggests fueling practice on long runs from 18 km', () => {
    const fueling =
      'Verpflegung wie im Wettkampf üben: ab Minute 40 alle 20–30 min rund 25 g Kohlenhydrate.'

    const planned18 = analyzeRun(run({ km: 18 }), ctx({ pf: planned({ t: 'long', km: 18 }) }))
    expect(planned18.kind).toBe('long')
    expect(planned18.nxt).toEqual([fueling])

    const detected = analyzeRun(run({ km: 19 }), ctx({ k80: 20 }))
    expect(detected.kind).toBe('long')
    expect(detected.nxt).toEqual([fueling])
  })

  it('uses a default next step per kind of run', () => {
    const next = (t: string, km: number) =>
      analyzeRun(run({ km }), ctx({ pf: planned({ t, km }) })).nxt

    expect(next('q', 10)).toEqual([
      'Morgen locker laufen oder frei. Die Qualität wirkt erst mit Erholung.',
    ])
    expect(next('long', 17.9)).toEqual(['Heute Kohlenhydrate, Eiweiß und Schlaf priorisieren.'])
    expect(next('race', 42.2)).toEqual(['Ein paar lockere Tage, bevor du wieder Tempo läufst.'])
    expect(next('easy', 8)).toEqual([DEFAULT_NEXT_EASY])
  })
})

describe('analyzeRun verdict and limits', () => {
  it('rates no finding as strong, one as good and two or more as attention', () => {
    expect(analyzeRun(run(), ctx()).v).toEqual({ t: 'Stark', c: 'g' })
    expect(analyzeRun(run({ rpe: 7 }), ctx()).v).toEqual({ t: 'Gut', c: 'y' })
    expect(analyzeRun(run({ rpe: 7, hr: 170 }), ctx({ hrmax: 200 })).v).toEqual({
      t: 'Achtung',
      c: 'r',
    })
  })

  it('keeps at most 3 findings and next steps, in order', () => {
    const streak = [1, 2, 3, 4, 5].map((n) => ({ d: daysBefore(n), km: 8, sec: 2800 }))
    const a = analyzeRun(
      run({ km: 12, sec: 3480, hr: 170, rpe: 7 }),
      ctx({ runs: streak, hrmax: 200, zones, pf: planned({ t: 'easy', km: 10 }) }),
    )

    expect(a.bad.map((b) => b.k)).toEqual(['fast', 'long', 'hr'])
    expect(a.nxt).toEqual([
      'Die ersten 3 km bewusst langsamer, im Gesprächstempo bleiben.',
      'Den geplanten Umfang einhalten. Mehr bringt nicht automatisch mehr.',
      'Langsamer starten. Hitze, Müdigkeit, Koffein und Stress treiben den Puls.',
    ])
    expect(a.good).toEqual([DEFAULT_GOOD])
    expect(a.v).toEqual({ t: 'Achtung', c: 'r' })
  })

  it('keeps at most 3 positive statements, in order', () => {
    const a = analyzeRun(
      run({ sec: 3100, hr: 140, rpe: 3 }),
      ctx({ hrmax: 200, zones, pf: planned({ t: 'easy', km: 10 }) }),
    )

    expect(a.good).toEqual([
      'Tempo im lockeren Bereich (5:10 /km)',
      'Umfang wie geplant (10 von 10 km)',
      'Puls entspannt (70 % der höchsten gemessenen Frequenz)',
    ])
    expect(a.bad).toEqual([])
  })
})
