import { afterEach, describe, expect, it, vi } from 'vitest'
import { addD, parse } from '../../lib/format'
import { buildCfg, phase } from './config'
import { dailyPlan, dayVolume, easyRun, longRun, longRunKm, qualityRun, weeksToRace } from './daily'
import type { DailyPlanInput, DayContext, PaceZones, PlanConfig } from './types'

type ConfigInput = Parameters<typeof buildCfg>[0]

const ZONES: PaceZones = { mp: 300, e1: 360, e2: 390, t: 280, i: 270, r: 260 }
const STRENGTH = 'Kraft zu Hause 20–25 min: einbeinige Kniebeuge, Hip Thrust, Wadenheben, Plank'
const DOUBLE_SESSION = ' · Doppeleinheit möglich (AM/PM)'

const configInput = (overrides: Partial<ConfigInput> = {}): ConfigInput => ({
  type: 'race',
  start: '2026-10-19',
  race: '2027-06-13',
  weeks: 12,
  cur: 50,
  peak: 80,
  cap: 32,
  rest: [0],
  lg: 6,
  str: 2,
  q: 2,
  tp: 3,
  ...overrides,
})

// 33 weeks, test week 16, recovery week 15. Roles: Mon rest, Tue q1, Wed easy, Thu q2,
// Fri str, Sat easy, Sun long.
const marathonConfig = buildCfg(configInput())
const halfMarathonConfig = buildCfg(configInput({ race: '2027-03-28', peak: 65, cap: 24 }))
const lowVolumeConfig = buildCfg(configInput({ cur: 15, peak: 20, cap: 10 }))

// Legacy default plan (`LEG` in app.js), the only source of the Regeneration phase.
const legacyDefaultConfig: PlanConfig = {
  tw: 49,
  T: [48, 38, 30, 21, 17],
  S: 13,
  A: [
    [49, 15],
    [48, 35],
    [47, 50],
    [40, 70],
    [37, 66],
    [29, 78],
    [22, 90],
    [21, 86],
    [20, 70],
    [16, 90],
    [5, 120],
    [3, 96],
    [2, 72],
    [1, 50],
    [0, 45],
  ],
  cap: 34,
  ls: 0.285,
  tl: [14, 18, 24],
  roles: ['rest', 'q1', 'easy', 'q2', 'str', 'easy', 'long'],
  W: [0, 0.21, 0.24, 0.22, 0.16, 0.17, 0],
  strD: [2, 4],
  test: 21,
  recov: 20,
  first: 49,
  fw: [2, 4],
  mul: false,
}

const marathonDay = (date: string, overrides: Partial<DailyPlanInput> = {}): DailyPlanInput => ({
  date: parse(date),
  today: parse('2026-10-19'),
  start: parse('2026-10-19'),
  race: '2027-06-13',
  config: marathonConfig,
  raceDistance: 42.195,
  goal: 12600,
  goalTime: 12600,
  zones: ZONES,
  weekFactor: 1,
  adaptationFactor: 1,
  withoutAdaptation: false,
  ...overrides,
})

const halfMarathonDay = (date: string): DailyPlanInput =>
  marathonDay(date, {
    race: '2027-03-28',
    config: halfMarathonConfig,
    raceDistance: 21.0975,
    goal: 12760,
    goalTime: 6120,
  })

const legacyDefaultDay = (date: string): DailyPlanInput =>
  marathonDay(date, {
    start: parse('2026-10-12'),
    race: '2027-09-26',
    config: legacyDefaultConfig,
  })

const lowVolumeDay = (date: string): DailyPlanInput =>
  marathonDay(date, { config: lowVolumeConfig })

const context = (overrides: Partial<DayContext> = {}): DayContext => ({
  config: marathonConfig,
  weeksToRace: 21,
  zones: ZONES,
  raceDistance: 42.195,
  goal: 12600,
  goalTime: 12600,
  volume: 62,
  strength: '',
  ...overrides,
})

function slotOf(input: DailyPlanInput): { phase: string; role: string } {
  return {
    phase: phase(input.config, weeksToRace(input.race, input.date), input.raceDistance),
    role: input.config.roles[(input.date.getDay() + 6) % 7],
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('weeksToRace', () => {
  it('zählt Kalenderwochen von Montag des Tages bis Montag der Rennwoche', () => {
    expect(weeksToRace('2027-06-13', parse('2026-10-19'))).toBe(33)
    expect(weeksToRace('2027-06-13', parse('2026-10-25'))).toBe(33)
    expect(weeksToRace('2027-06-13', parse('2027-06-07'))).toBe(0)
    expect(weeksToRace('2027-06-13', parse('2027-06-13'))).toBe(0)
    expect(weeksToRace('2027-06-13', parse('2027-06-14'))).toBe(-1)
  })

  it('bleibt über Zeitumstellungen hinweg ganzzahlig', () => {
    expect(weeksToRace('2027-06-13', parse('2026-11-02'))).toBe(31)
    expect(weeksToRace('2027-06-13', parse('2027-03-29'))).toBe(10)
  })
})

describe('longRunKm', () => {
  it('nimmt den Longrun-Anteil des Wochenumfangs, begrenzt durch das Maximum', () => {
    expect(longRunKm(marathonConfig, 33, 50)).toBe(20)
    expect(longRunKm(marathonConfig, 10, 100)).toBe(32)
  })

  it('nutzt unter 30 km Wochenumfang ein Viertel des Umfangs', () => {
    expect(longRunKm(marathonConfig, 21, 17)).toBe(4)
  })

  it('übernimmt in den Taper-Wochen die festen Taper-Longruns', () => {
    expect(longRunKm(marathonConfig, 1, 40)).toBe(14)
    expect(longRunKm(marathonConfig, 2, 56)).toBe(21)
    expect(longRunKm(marathonConfig, 3, 80)).toBe(32)
    expect(longRunKm(marathonConfig, 0, 30)).toBe(12)
  })
})

describe('dailyPlan ohne globalen Zustand', () => {
  it('liefert unabhängig vom aktuellen Datum dasselbe Ergebnis und verändert die Eingabe nicht', () => {
    const inputs = [
      marathonDay('2026-10-20'),
      marathonDay('2026-11-29', { today: parse('2026-11-17'), adaptationFactor: 0.85 }),
      marathonDay('2027-06-13'),
    ]
    const before = structuredClone(inputs)

    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 8))
    const first = inputs.map((input) => [dailyPlan(input), dayVolume(input)])
    vi.setSystemTime(new Date(2030, 5, 15, 20))
    const second = inputs.map((input) => [dailyPlan(input), dayVolume(input)])

    expect(second).toEqual(first)
    expect(inputs).toEqual(before)
    expect(marathonConfig).toEqual(buildCfg(configInput()))
  })
})

describe('dailyPlan: Planzeitraum', () => {
  it('liefert null vor dem Planstart und nach dem Rennen', () => {
    expect(dailyPlan(marathonDay('2026-10-18'))).toBeNull()
    expect(dailyPlan(marathonDay('2027-06-14'))).toBeNull()
  })

  it('liefert am Starttag und am Renntag einen Plan', () => {
    expect(dailyPlan(marathonDay('2026-10-19'))).toEqual({
      t: 'rest',
      lab: 'Recovery',
      km: 0,
      d: 'Ruhetag. Optional 15 min Mobility.',
    })
    expect(dailyPlan(marathonDay('2027-06-13'))).toEqual({
      t: 'race',
      lab: 'MARATHON',
      km: 42.2,
      d: 'Renntag! Ziel 3:30:00 (4:59/km). Erste 10 km kontrolliert bei ca. 5:05/km.',
    })
  })

  it('beschreibt den Renntag für kürzere Distanzen mit der Zielzeit der Renndistanz', () => {
    expect(dailyPlan(halfMarathonDay('2027-03-28'))).toEqual({
      t: 'race',
      lab: 'HALBMARATHON',
      km: 21.1,
      d: 'Renntag! Ziel 1:42:00 (4:50/km). Erste 3 km kontrolliert bei ca. 4:56/km.',
    })
  })
})

describe('dailyPlan: lockere Tage', () => {
  it('gibt lockeren Tagen den Kraft-Hinweis an Krafttagen mit', () => {
    expect(dailyPlan(marathonDay('2026-10-21'))).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 6,
      str: STRENGTH,
      d: '6 km locker @ 6:00–6:30 /km',
    })
    expect(dailyPlan(marathonDay('2026-10-23'))).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 5,
      str: STRENGTH,
      d: '5 km locker @ 6:00–6:30 /km + 6 × 20 s Steigerungsläufe',
    })
    expect(dailyPlan(marathonDay('2026-10-24'))).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 6,
      str: '',
      d: '6 km locker @ 6:00–6:30 /km',
    })
  })
})

describe('dailyPlan: Phase Regeneration', () => {
  it('plant am Qualitätstag eine lockere Einheit', () => {
    const input = legacyDefaultDay('2026-10-20')
    expect(slotOf(input)).toEqual({ phase: 'Regeneration', role: 'q1' })
    expect(dailyPlan(input)).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 5,
      str: '',
      d: '5 km locker @ 6:00–6:30 /km',
    })
  })

  it('plant einen lockeren Longrun', () => {
    const input = legacyDefaultDay('2026-10-25')
    expect(slotOf(input)).toEqual({ phase: 'Regeneration', role: 'long' })
    expect(dailyPlan(input)).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 10,
      d: '10 km locker @ 6:00–6:30',
    })
  })

  it('plant in der ersten Regenerationswoche nur feste lockere Läufe', () => {
    expect(dailyPlan(legacyDefaultDay('2026-10-13'))).toEqual({
      t: 'rest',
      lab: 'Recovery',
      km: 0,
      d: 'Ruhetag. Optional 15 min Mobility.',
    })
    expect(dailyPlan(legacyDefaultDay('2026-10-14'))).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 6,
      str: '',
      d: '6 km locker @ 6:00–6:30 /km',
    })
    expect(dailyPlan(legacyDefaultDay('2026-10-18'))).toEqual({
      t: 'long',
      lab: 'Locker',
      km: 8,
      d: '8 km ganz locker, Regenerationswoche.',
    })
  })
})

describe('dailyPlan: Phase Grundlagen', () => {
  it('plant Hügel und Fahrtspiel als Qualitätseinheiten', () => {
    const q1 = marathonDay('2026-10-20')
    expect(slotOf(q1)).toEqual({ phase: 'Grundlagen', role: 'q1' })
    expect(dailyPlan(q1)).toEqual({
      t: 'q',
      lab: 'Hügel',
      km: 7,
      str: '',
      d: '7 km gesamt: locker, davon 8 × 60 s bergauf kräftig (Trabpause)',
    })
    expect(dailyPlan(marathonDay('2026-10-22'))).toEqual({
      t: 'q',
      lab: 'Fahrtspiel',
      km: 7,
      str: '',
      d: '7 km gesamt: 6 × 2 min zügig (4:40), je 2 min locker',
    })
  })

  it('plant einen Longrun', () => {
    const input = marathonDay('2026-10-25')
    expect(slotOf(input)).toEqual({ phase: 'Grundlagen', role: 'long' })
    expect(dailyPlan(input)).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 20,
      d: '20 km @ 6:00–6:30',
    })
  })
})

describe('dailyPlan: Phase Tempoentwicklung', () => {
  it('plant Intervalle und Tempolauf als Qualitätseinheiten', () => {
    const q1 = marathonDay('2026-12-15')
    expect(slotOf(q1)).toEqual({ phase: 'Tempoentwicklung', role: 'q1' })
    expect(dailyPlan(q1)).toEqual({
      t: 'q',
      lab: 'Intervalle',
      km: 8,
      str: '',
      d: '8 km gesamt: Einlaufen + 8 × 1000 m @ 4:30 (90 s Pause)',
    })
    expect(dailyPlan(marathonDay('2026-12-17'))).toEqual({
      t: 'q',
      lab: 'Tempo',
      km: 8,
      str: '',
      d: '8 km gesamt: 20 min @ 4:40 (Schwelle) im Lauf',
    })
  })

  it('plant einen Longrun', () => {
    const input = marathonDay('2026-12-20')
    expect(slotOf(input)).toEqual({ phase: 'Tempoentwicklung', role: 'long' })
    expect(dailyPlan(input)).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 23,
      d: '23 km @ 6:00–6:30',
    })
  })
})

describe('dailyPlan: Phase Schwelle & Test', () => {
  it('plant Schwelle und Tempo-Dauerlauf als Qualitätseinheiten', () => {
    const q1 = marathonDay('2027-01-12')
    expect(slotOf(q1)).toEqual({ phase: 'Schwelle & Test', role: 'q1' })
    expect(dailyPlan(q1)).toEqual({
      t: 'q',
      lab: 'Schwelle',
      km: 8,
      str: '',
      d: '8 km gesamt: 4 × 2 km @ 4:40 (2 min Pause)',
    })
    expect(dailyPlan(marathonDay('2027-01-14'))).toEqual({
      t: 'q',
      lab: 'Tempo-DL',
      km: 8,
      str: '',
      d: '8 km gesamt: 4 km @ 4:40',
    })
  })

  it('plant einen Longrun', () => {
    const input = marathonDay('2027-01-17')
    expect(slotOf(input)).toEqual({ phase: 'Schwelle & Test', role: 'long' })
    expect(dailyPlan(input)).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 25,
      d: '25 km @ 6:00–6:30',
    })
  })

  it('ersetzt den Longrun der Testwoche durch den Testlauf', () => {
    const input = marathonDay('2027-02-21')
    expect(weeksToRace(input.race, input.date)).toBe(marathonConfig.test)
    expect(dailyPlan(input)).toEqual({
      t: 'race',
      lab: 'Testlauf',
      km: 15,
      d: 'Testwettkampf 10 km (Ziel ca. 0:45:39) plus Ein-/Auslaufen. Ergebnis unter „Leistung“ eintragen – danach passen sich alle Paces an.',
    })
  })
})

describe('dailyPlan: Phase Entlastung', () => {
  it('plant Intervalle und Tempo-Dauerlauf als Qualitätseinheiten', () => {
    const q1 = marathonDay('2027-03-09')
    expect(slotOf(q1)).toEqual({ phase: 'Entlastung + Basis', role: 'q1' })
    expect(dailyPlan(q1)).toEqual({
      t: 'q',
      lab: 'Intervalle',
      km: 9,
      str: '',
      d: '9 km gesamt: 5 × 1000 m @ 4:30 (90 s Pause)',
    })
    expect(dailyPlan(marathonDay('2027-03-11'))).toEqual({
      t: 'q',
      lab: 'Tempo-DL',
      km: 9,
      str: '',
      d: '9 km gesamt: 5 km @ 4:40',
    })
  })

  it('plant einen Longrun mit Verpflegungshinweis ab 28 km', () => {
    const input = marathonDay('2027-03-14')
    expect(slotOf(input)).toEqual({ phase: 'Entlastung + Basis', role: 'long' })
    expect(dailyPlan(input)).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 28,
      d: '28 km @ 6:00–6:30 · Verpflegung üben',
    })
  })

  it('plant in der Erholungswoche nach dem Test nur lockere Einheiten', () => {
    const q1 = marathonDay('2027-02-23')
    expect(weeksToRace(q1.race, q1.date)).toBe(marathonConfig.recov)
    expect(slotOf(q1)).toEqual({ phase: 'Entlastung + Basis', role: 'q1' })
    expect(dailyPlan(q1)).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 7,
      str: '',
      d: '7 km locker @ 6:00–6:30 /km',
    })
    expect(dailyPlan(marathonDay('2027-02-28'))).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 21,
      d: '21 km locker @ 6:00–6:30',
    })
  })
})

describe('dailyPlan: Phase wettkampfspezifisch', () => {
  it('plant beim Marathon MRT-Block und Schwelle als Qualitätseinheiten', () => {
    const q1 = marathonDay('2027-04-06')
    expect(slotOf(q1)).toEqual({ phase: 'Marathonspezifisch', role: 'q1' })
    expect(dailyPlan(q1)).toEqual({
      t: 'q',
      lab: 'MRT-Block',
      km: 10,
      str: '',
      d: '10 km gesamt: 6 km @ 5:00 in 2–3 Blöcken (1 km locker dazwischen)',
    })
    expect(dailyPlan(marathonDay('2027-04-08'))).toEqual({
      t: 'q',
      lab: 'Schwelle',
      km: 10,
      str: '',
      d: '10 km gesamt: 3 × 3 km @ 4:40 (2 min Pause)',
    })
  })

  it('plant beim Marathon in geraden Wochen einen Longrun mit MRT-Anteil', () => {
    const odd = marathonDay('2027-04-11')
    expect(slotOf(odd)).toEqual({ phase: 'Marathonspezifisch', role: 'long' })
    expect(dailyPlan(odd)).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 30,
      d: '30 km @ 6:00–6:30 · Verpflegung üben',
    })
    expect(dailyPlan(marathonDay('2027-04-18'))).toEqual({
      t: 'long',
      lab: 'Longrun MRT',
      km: 30,
      d: '30 km: locker, die letzten 17 km @ 5:00',
    })
  })

  it('plant beim Halbmarathon Racepace und einen Longrun ohne MRT-Anteil', () => {
    const q1 = halfMarathonDay('2026-12-22')
    expect(slotOf(q1)).toEqual({ phase: 'Wettkampfspezifisch', role: 'q1' })
    expect(dailyPlan(q1)).toEqual({
      t: 'q',
      lab: 'Racepace',
      km: 8,
      str: '',
      d: '8 km gesamt: Einlaufen + 2 × 2000 m @ 4:50 (2 min Pause)',
    })
    const long = halfMarathonDay('2027-01-03')
    expect(slotOf(long)).toEqual({ phase: 'Wettkampfspezifisch', role: 'long' })
    expect(weeksToRace(long.race, long.date) % 2).toBe(0)
    expect(dailyPlan(long)).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 21,
      d: '21 km @ 6:00–6:30',
    })
  })
})

describe('dailyPlan: Tapering', () => {
  it('plant MRT, Schärfe und feste Taper-Longruns', () => {
    expect(dailyPlan(marathonDay('2027-05-25'))).toEqual({
      t: 'q',
      lab: 'MRT',
      km: 8,
      str: '',
      d: '8 km gesamt: 8 km @ 5:00',
    })
    expect(dailyPlan(marathonDay('2027-05-27'))).toEqual({
      t: 'q',
      lab: 'Schärfe',
      km: 8,
      str: '',
      d: '8 km gesamt: 5 × 1000 m @ 4:30',
    })
    expect(dailyPlan(marathonDay('2027-05-30'))).toMatchObject({ t: 'long', km: 21 })
    expect(dailyPlan(marathonDay('2027-06-06'))).toMatchObject({ t: 'long', km: 14 })
  })

  it('plant in der Rennwoche Aktivierung und lockere Steigerungsläufe', () => {
    expect(dailyPlan(marathonDay('2027-06-08'))).toEqual({
      t: 'q',
      lab: 'Aktivierung',
      km: 4,
      str: '',
      d: '4 km gesamt: 3 × 2 min @ 5:00',
    })
    expect(dailyPlan(marathonDay('2027-06-10'))).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 4,
      str: '',
      d: '4 km locker @ 6:00–6:30 /km + Steigerungsläufe',
    })
  })
})

describe('dayVolume', () => {
  it('nutzt den Wochenumfang der Konfiguration', () => {
    expect(dayVolume(marathonDay('2026-10-20'))).toBe(50)
  })

  it('senkt den Umfang in Test-, Erholungs- und Entlastungswochen', () => {
    expect(dayVolume(marathonDay('2027-02-16'))).toBeCloseTo(67 * 0.95)
    expect(dayVolume(marathonDay('2027-02-23'))).toBeCloseTo(68 * 0.78)
    expect(dayVolume(marathonDay('2026-11-10'))).toBeCloseTo(53 * 0.78)
  })

  it('wendet den Wochenfaktor an', () => {
    expect(dayVolume(marathonDay('2026-10-20', { weekFactor: 1.1 }))).toBeCloseTo(55)
  })
})

describe('Planpassung', () => {
  const adapted = (date: string, overrides: Partial<DailyPlanInput> = {}): DailyPlanInput =>
    marathonDay(date, { today: parse('2026-11-17'), adaptationFactor: 0.85, ...overrides })

  it('wirkt auf die Tage heute bis heute + 13', () => {
    const today = parse('2026-11-17')
    expect(dayVolume(adapted('2026-11-17'))).toBeCloseTo(54 * 0.85)
    expect(dayVolume(adapted('2026-11-24'))).toBeCloseTo(55 * 0.85)
    expect(dayVolume({ ...adapted('2026-11-17'), date: addD(today, 13) })).toBeCloseTo(56 * 0.85)
  })

  it('wirkt nicht auf gestern und nicht auf heute + 14', () => {
    const today = parse('2026-11-17')
    expect(dayVolume({ ...adapted('2026-11-17'), date: addD(today, -1) })).toBe(54)
    expect(dayVolume({ ...adapted('2026-11-17'), date: addD(today, 14) })).toBe(56)
  })

  it('wirkt nicht, wenn ohne Anpassung gerechnet wird', () => {
    expect(dayVolume(adapted('2026-11-17', { withoutAdaptation: true }))).toBe(54)
    expect(dayVolume(adapted('2026-11-24', { withoutAdaptation: true }))).toBe(55)
  })

  it('verändert die geplanten Kilometer nur innerhalb des Zeitraums', () => {
    expect(dailyPlan(adapted('2026-11-29'))).toMatchObject({ t: 'long', km: 19 })
    expect(dailyPlan(adapted('2026-11-29', { withoutAdaptation: true }))).toMatchObject({
      t: 'long',
      km: 22,
    })
    expect(dailyPlan(adapted('2026-12-06'))).toMatchObject({ t: 'long', km: 22 })
  })
})

describe('easyRun: Doppeleinheit', () => {
  it('erscheint ab 100 km Wochenumfang und ab 14 km Einheit', () => {
    expect(easyRun(context({ volume: 100 }), 14)).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 14,
      str: '',
      d: `14 km locker @ 6:00–6:30 /km${DOUBLE_SESSION}`,
    })
  })

  it('erscheint nicht knapp unter 100 km Wochenumfang', () => {
    expect(easyRun(context({ volume: 99.9 }), 14).d).toBe('14 km locker @ 6:00–6:30 /km')
  })

  it('erscheint nicht unter 14 km Einheit', () => {
    expect(easyRun(context({ volume: 100 }), 13).d).toBe('13 km locker @ 6:00–6:30 /km')
    expect(easyRun(context({ volume: 99.9 }), 13).d).toBe('13 km locker @ 6:00–6:30 /km')
  })

  it('steht hinter dem Zusatztext und übernimmt den Kraft-Hinweis', () => {
    expect(
      easyRun(context({ volume: 120, strength: STRENGTH }), 15, ' + Steigerungsläufe'),
    ).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 15,
      str: STRENGTH,
      d: `15 km locker @ 6:00–6:30 /km + Steigerungsläufe${DOUBLE_SESSION}`,
    })
  })

  it('erscheint im Tagesplan einer Woche mit mindestens 100 km', () => {
    expect(dailyPlan(legacyDefaultDay('2027-06-30'))).toEqual({
      t: 'easy',
      lab: 'Locker',
      km: 17,
      str: STRENGTH,
      d: `17 km locker @ 6:00–6:30 /km${DOUBLE_SESSION}`,
    })
    expect(dailyPlan(legacyDefaultDay('2027-06-23'))?.d).toBe('17 km locker @ 6:00–6:30 /km')
  })
})

describe('qualityRun', () => {
  it('baut die Einheit aus Rolle, Phase und Kilometern', () => {
    expect(qualityRun(context({ weeksToRace: 25, strength: STRENGTH }), 'q1', 8)).toEqual({
      t: 'q',
      lab: 'Intervalle',
      km: 8,
      str: STRENGTH,
      d: '8 km gesamt: Einlaufen + 8 × 1000 m @ 4:30 (90 s Pause)',
    })
  })

  // Known bug, see TG-20: with few kilometres the tempo share of "Tempo-DL" is ≤ 0 km.
  // These tests pin the current behaviour until TG-20 fixes it.
  it('hält den Tempoanteil ≤ 0 km bei wenig Umfang als Ist-Verhalten fest (TG-20)', () => {
    expect(qualityRun(context({ weeksToRace: 21 }), 'q2', 4).d).toBe('4 km gesamt: 0 km @ 4:40')
    expect(qualityRun(context({ weeksToRace: 21 }), 'q2', 3).d).toBe('3 km gesamt: -1 km @ 4:40')
    expect(qualityRun(context({ weeksToRace: 13 }), 'q2', 4).d).toBe('4 km gesamt: 0 km @ 4:40')
    expect(qualityRun(context({ weeksToRace: 13 }), 'q2', 3).d).toBe('3 km gesamt: -1 km @ 4:40')
  })

  // Known bug, see TG-20.
  it('zeigt den negativen Tempoanteil auch im Tagesplan mit wenig Umfang (TG-20)', () => {
    expect(dailyPlan(lowVolumeDay('2027-01-14'))).toEqual({
      t: 'q',
      lab: 'Tempo-DL',
      km: 3,
      str: '',
      d: '3 km gesamt: -1 km @ 4:40',
    })
    expect(dailyPlan(lowVolumeDay('2027-03-11'))?.d).toBe('3 km gesamt: -1 km @ 4:40')
  })
})

describe('longRun', () => {
  it('baut den Longrun der Phase ohne Kraft-Hinweis', () => {
    const regular = longRun(context({ weeksToRace: 9, strength: STRENGTH }), 30)
    expect(regular).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 30,
      d: '30 km @ 6:00–6:30 · Verpflegung üben',
    })
    expect(regular).not.toHaveProperty('str')
    expect(longRun(context({ weeksToRace: 8 }), 30)).toEqual({
      t: 'long',
      lab: 'Longrun MRT',
      km: 30,
      d: '30 km: locker, die letzten 17 km @ 5:00',
    })
    expect(longRun(context({ weeksToRace: 15 }), 21)).toEqual({
      t: 'long',
      lab: 'Longrun',
      km: 21,
      d: '21 km locker @ 6:00–6:30',
    })
  })
})
