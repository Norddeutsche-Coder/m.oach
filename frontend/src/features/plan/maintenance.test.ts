import { describe, expect, it } from 'vitest'
import { addD, iso, parse } from '../../lib/format'
import { day } from '../../test/fixtures'
import { planM } from './maintenance'
import type { MaintenanceConfig, MaintenanceContext, PaceZones } from './types'

// Monday to Sunday: rest, q1, easy (strength), q2, str (strength), easy, long.
const config: MaintenanceConfig = {
  roles: ['rest', 'q1', 'easy', 'q2', 'str', 'easy', 'long'],
  A: [[16, 50]],
  strD: [2, 4],
  ls: 0.3,
  cap: 32,
  W: [0, 0.21, 0.24, 0.22, 0.16, 0.17, 0],
}

// Formatted with fp: e1 5:48, e2 6:30, t 4:44 (283.5 rounds up), i 4:33.
const zones: PaceZones = { mp: 300, e1: 348, e2: 390, t: 283.5, i: 273, r: 261 }

const STRENGTH = 'Kraft zu Hause 20–25 min: einbeinige Kniebeuge, Hip Thrust, Wadenheben, Plank'

const context = (overrides: Partial<MaintenanceContext> = {}): MaintenanceContext => ({
  start: day('2026-10-19'),
  zones,
  weekFactor: 1,
  adaptationFactor: 1,
  ...overrides,
})

// Week 0 starts on Monday 2026-10-19; V = 50, long run = min(32, round(50 * 0.3)) = 15,
// other days round((50 - 15) * W[day]).
describe('planM: Tagestypen im Erhaltungsplan', () => {
  it('plant am Ruhetag Recovery ohne Kraft-Schlüssel', () => {
    const planned = planM(day('2026-10-19'), config, context())

    expect(planned).toStrictEqual({
      t: 'rest',
      lab: 'Recovery',
      km: 0,
      d: 'Ruhetag. Optional 15 min Mobility.',
    })
    expect(planned).not.toHaveProperty('str')
  })

  it('plant einen lockeren Lauf mit Kraft-Text am Krafttag', () => {
    // round(35 * 0.24) = 8
    expect(planM(day('2026-10-21'), config, context())).toStrictEqual({
      t: 'easy',
      lab: 'Locker',
      km: 8,
      str: STRENGTH,
      d: '8 km locker @ 5:48–6:30 /km',
    })
  })

  it('plant einen lockeren Lauf ohne Kraft-Text an Tagen ohne Krafttraining', () => {
    // round(35 * 0.17) = 6
    expect(planM(day('2026-10-24'), config, context())).toStrictEqual({
      t: 'easy',
      lab: 'Locker',
      km: 6,
      str: '',
      d: '6 km locker @ 5:48–6:30 /km',
    })
  })

  it('hängt am Steigerungstag die Steigerungsläufe an den lockeren Lauf an', () => {
    // round(35 * 0.16) = 6
    expect(planM(day('2026-10-23'), config, context())).toStrictEqual({
      t: 'easy',
      lab: 'Locker',
      km: 6,
      str: STRENGTH,
      d: '6 km locker @ 5:48–6:30 /km + 6 × 20 s Steigerungsläufe',
    })
  })

  it('plant den Longrun als Anteil des Wochenumfangs ohne Kraft-Schlüssel', () => {
    const planned = planM(day('2026-10-25'), config, context())

    expect(planned).toStrictEqual({ t: 'long', lab: 'Longrun', km: 15, d: '15 km @ 5:48–6:30' })
    expect(planned).not.toHaveProperty('str')
  })

  it('deckelt den Longrun bei cap und verteilt den Rest auf die übrigen Tage', () => {
    const capped: MaintenanceConfig = { ...config, cap: 12 }

    expect(planM(day('2026-10-25'), capped, context())).toStrictEqual({
      t: 'long',
      lab: 'Longrun',
      km: 12,
      d: '12 km @ 5:48–6:30',
    })
    // round((50 - 12) * 0.24) = 9
    expect(planM(day('2026-10-21'), capped, context()).km).toBe(9)
  })
})

describe('planM: Qualitätseinheiten im Dreiwochenwechsel', () => {
  it('wechselt q1 über drei Wochen zwischen Fahrtspiel, Tempo und Hügel', () => {
    // round(35 * 0.21) = 7; Tuesday is no strength day.
    expect(planM(day('2026-10-20'), config, context())).toStrictEqual({
      t: 'q',
      lab: 'Fahrtspiel',
      km: 7,
      str: '',
      d: '7 km gesamt: 6 × 2 min zügig (4:44), je 2 min locker',
    })
    expect(planM(day('2026-10-27'), config, context())).toStrictEqual({
      t: 'q',
      lab: 'Tempo',
      km: 7,
      str: '',
      d: '7 km gesamt: 20 min @ 4:44 (Schwelle) im Lauf',
    })
    expect(planM(day('2026-11-03'), config, context())).toStrictEqual({
      t: 'q',
      lab: 'Hügel',
      km: 7,
      str: '',
      d: '7 km gesamt: locker, davon 6 × 60 s bergauf kräftig (Trabpause)',
    })
  })

  it('wechselt q2 über drei Wochen zwischen Intervallen, Schwelle und Tempo', () => {
    // round(35 * 0.22) = 8
    expect(planM(day('2026-10-22'), config, context())).toStrictEqual({
      t: 'q',
      lab: 'Intervalle',
      km: 8,
      str: '',
      d: '8 km gesamt: Einlaufen + 5 × 800 m @ 4:33 (90 s Pause)',
    })
    expect(planM(day('2026-10-29'), config, context())).toStrictEqual({
      t: 'q',
      lab: 'Schwelle',
      km: 8,
      str: '',
      d: '8 km gesamt: 3 × 8 min @ 4:44 (2 min Pause)',
    })
    expect(planM(day('2026-11-05'), config, context())).toStrictEqual({
      t: 'q',
      lab: 'Tempo',
      km: 8,
      str: '',
      d: '8 km gesamt: 15 min @ 4:44 im Lauf',
    })
  })

  it('übernimmt den Kraft-Text auch an Qualitätstagen, die Krafttage sind', () => {
    const strengthOnQuality: MaintenanceConfig = { ...config, strD: [1] }

    expect(planM(day('2026-10-20'), strengthOnQuality, context()).str).toBe(STRENGTH)
    expect(planM(day('2026-10-21'), strengthOnQuality, context()).str).toBe('')
  })
})

describe('planM: Entlastungswochen', () => {
  it('senkt in Woche 3 den Umfang auf 80 % und ersetzt q1 und q2 durch lockere Läufe', () => {
    // V = 40, long run round(40 * 0.3) = 12, other days round(28 * W[day]).
    expect(planM(day('2026-11-10'), config, context())).toStrictEqual({
      t: 'easy',
      lab: 'Locker',
      km: 6,
      str: '',
      d: '6 km locker @ 5:48–6:30 /km',
    })
    expect(planM(day('2026-11-12'), config, context())).toStrictEqual({
      t: 'easy',
      lab: 'Locker',
      km: 6,
      str: '',
      d: '6 km locker @ 5:48–6:30 /km',
    })
    expect(planM(day('2026-11-11'), config, context()).km).toBe(7)
    expect(planM(day('2026-11-13'), config, context()).km).toBe(4)
    expect(planM(day('2026-11-14'), config, context()).km).toBe(5)
    expect(planM(day('2026-11-15'), config, context())).toStrictEqual({
      t: 'long',
      lab: 'Longrun',
      km: 12,
      d: '12 km @ 5:48–6:30',
    })
    expect(planM(day('2026-11-09'), config, context()).t).toBe('rest')
  })

  it('hat in Woche 3 rund 80 % des Wochenumfangs einer Normalwoche', () => {
    const weekKm = (monday: string) =>
      Array.from({ length: 7 }, (_, index) => planM(addD(day(monday), index), config, context()))
        .map((planned) => planned.km)
        .reduce((sum, km) => sum + km, 0)

    expect(weekKm('2026-10-19')).toBe(50)
    expect(weekKm('2026-11-09')).toBe(40)
  })

  it('plant Woche 4 wieder normal mit Qualität', () => {
    expect(planM(day('2026-11-17'), config, context())).toMatchObject({
      t: 'q',
      lab: 'Tempo',
      km: 7,
    })
    expect(planM(day('2026-11-19'), config, context())).toMatchObject({
      t: 'q',
      lab: 'Schwelle',
      km: 8,
    })
    expect(planM(day('2026-11-22'), config, context()).km).toBe(15)
  })

  it('entlastet jede vierte Woche, also auch Woche 7', () => {
    expect(planM(day('2026-12-08'), config, context())).toMatchObject({
      t: 'easy',
      lab: 'Locker',
      km: 6,
    })
    expect(planM(day('2026-12-13'), config, context()).km).toBe(12)
    // Week 8 is a normal week again (8 % 3 = 2: Hügel).
    expect(planM(day('2026-12-15'), config, context()).lab).toBe('Hügel')
  })
})

describe('planM: Umfangsfaktoren', () => {
  it('skaliert den Umfang mit dem Wochenfaktor', () => {
    const scaled = context({ weekFactor: 1.2 })

    // V = 60, long run round(18) = 18, Wednesday round(42 * 0.24) = 10.
    expect(planM(day('2026-10-25'), config, scaled).km).toBe(18)
    expect(planM(day('2026-10-21'), config, scaled)).toStrictEqual({
      t: 'easy',
      lab: 'Locker',
      km: 10,
      str: STRENGTH,
      d: '10 km locker @ 5:48–6:30 /km',
    })
  })

  it('skaliert den Umfang mit dem Anpassungsfaktor', () => {
    const adapted = context({ adaptationFactor: 0.9 })

    // V = 45, long run round(13.5) = 14, Wednesday round(31 * 0.24) = 7.
    expect(planM(day('2026-10-25'), config, adapted).km).toBe(14)
    expect(planM(day('2026-10-21'), config, adapted).km).toBe(7)
  })

  it('kombiniert Entlastung, Wochenfaktor und Anpassungsfaktor', () => {
    const combined = context({ weekFactor: 1.2, adaptationFactor: 0.9 })

    // V = 50 * 0.8 * 1.2 * 0.9 = 43.2, long run round(12.96) = 13, Wednesday round(30.2 * 0.24) = 7.
    expect(planM(day('2026-11-15'), config, combined).km).toBe(13)
    expect(planM(day('2026-11-11'), config, combined).km).toBe(7)
    expect(planM(day('2026-11-10'), config, combined).lab).toBe('Locker')
  })

  it('lässt den Ruhetag bei jedem Faktor bei 0 km', () => {
    const planned = planM(day('2026-10-19'), config, context({ weekFactor: 1.5 }))

    expect(planned.km).toBe(0)
  })
})

describe('planM: Wochenzählung', () => {
  const expectedTuesday = (week: number): string =>
    week % 4 === 3 ? 'Locker' : ['Fahrtspiel', 'Tempo', 'Hügel'][week % 3]

  it('zählt über den Sommerzeitbeginn im März ganzzahlige Wochen', () => {
    const start = context({ start: day('2026-03-02') })

    // 2026-03-29 is the last Sunday in March.
    expect(planM(day('2026-03-24'), config, start).lab).toBe('Locker')
    expect(planM(day('2026-03-29'), config, start).km).toBe(12)
    expect(planM(day('2026-03-31'), config, start).lab).toBe('Tempo')
    expect(planM(day('2026-04-05'), config, start).km).toBe(15)
  })

  it('zählt über das Sommerzeitende im Oktober ganzzahlige Wochen', () => {
    const start = context({ start: day('2026-10-05') })

    // 2026-10-25 is the last Sunday in October and closes week 2.
    expect(planM(day('2026-10-25'), config, start).km).toBe(15)
    expect(planM(day('2026-10-27'), config, start).lab).toBe('Locker')
    expect(planM(day('2026-11-01'), config, start).km).toBe(12)
    expect(planM(day('2026-11-03'), config, start).lab).toBe('Tempo')
  })

  it('zählt jede Woche eines ganzen Jahres richtig, unabhängig von der Zeitzone', () => {
    const start = day('2026-01-05')

    for (let week = 0; week < 60; week += 1) {
      const tuesday = addD(start, week * 7 + 1)
      expect(planM(tuesday, config, context({ start })).lab, iso(tuesday)).toBe(
        expectedTuesday(week),
      )
    }
  })

  it('zählt bei einem Planstart mitten in der Woche die Startwoche als Woche 0', () => {
    const start = context({ start: parse('2026-10-21') })

    expect(planM(day('2026-10-22'), config, start).lab).toBe('Intervalle')
    expect(planM(day('2026-10-25'), config, start).km).toBe(15)
    expect(planM(day('2026-10-27'), config, start).lab).toBe('Tempo')
    expect(planM(day('2026-11-10'), config, start).lab).toBe('Locker')
    expect(planM(day('2026-11-17'), config, start).lab).toBe('Tempo')
  })
})
