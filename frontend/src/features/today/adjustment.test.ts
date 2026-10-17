import { describe, expect, it } from 'vitest'
import { adjust, RACE_PACING_NOTE } from './adjustment'
import type { Plan } from './types'

const race: Plan = { t: 'race', lab: 'MARATHON', km: 42.2, d: 'Renntag! Ziel 2:45:00 (3:55/km).' }
const tune: Plan = {
  t: 'race',
  lab: 'WK 10 km',
  ttl: 'Stadtlauf · 10 km',
  km: 13,
  d: '10 km Wettkampf plus Ein- und Auslaufen.',
}
const testRun: Plan = {
  t: 'race',
  lab: 'Testlauf',
  km: 15,
  d: 'Testwettkampf 10 km (Ziel ca. 0:37:00) plus Ein-/Auslaufen.',
}
const lvl = (l: 0 | 1 | 2, pain = 0) => ({ lvl: l, pain })

describe('adjust for races', () => {
  for (const [name, p] of [
    ['race day', race],
    ['tune-up race', tune],
  ] as const) {
    it(`keeps the ${name} as planned at level 0`, () => {
      expect(adjust(p, lvl(0))).toEqual({ mode: 'plan', km: p.km, title: null, note: '' })
    })

    for (const l of [1, 2] as const) {
      it(`never suggests moving the ${name} at level ${l}, but gives pacing advice`, () => {
        const adj = adjust(p, lvl(l))
        expect(adj).toEqual({ mode: 'plan', km: p.km, title: null, note: RACE_PACING_NOTE })
        expect(adj.note).not.toMatch(/verschieben/i)
        expect(adj.note).toMatch(/Erste Kilometer bewusst kontrolliert/)
        expect(adj.note).not.toMatch(/Ziel/)
      })
    }
  }

  it('keeps the test run as planned at level 0', () => {
    expect(adjust(testRun, lvl(0))).toEqual({ mode: 'plan', km: 15, title: null, note: '' })
  })

  for (const l of [1, 2] as const) {
    it(`still suggests moving the test run at level ${l}`, () => {
      expect(adjust(testRun, lvl(l))).toEqual({
        mode: 'move',
        km: 0,
        title: 'Wettkampf verschieben',
        note: 'Ein Test in angeschlagenem Zustand liefert falsche Paces. Besser 2–4 Tage verschieben.',
      })
    })
  }

  it('advises against running on race day with clear pain, without suggesting a move', () => {
    const adj = adjust(race, lvl(0, 2))
    expect(adj.mode).toBe('rest')
    expect(adj.title).toBe('Heute kein Lauf')
    expect(adj.note).not.toMatch(/verschieben/i)
  })
})

describe('adjust for training days', () => {
  it('keeps rest days and stresses recovery at level 2', () => {
    expect(adjust({ t: 'rest', lab: 'Ruhetag', km: 0, d: '' }, lvl(1)).note).toBe('')
    expect(adjust({ t: 'rest', lab: 'Ruhetag', km: 0, d: '' }, lvl(2)).note).toBe(
      'Erholung ist heute dein wichtigstes Training.',
    )
  })

  it('shortens runs by 20 % at level 1', () => {
    expect(adjust({ t: 'easy', lab: 'Locker', km: 10, d: '' }, lvl(1))).toMatchObject({
      mode: 'reduced',
      km: 8,
    })
    expect(adjust({ t: 'easy', lab: 'Locker', km: 3, d: '' }, lvl(1))).toMatchObject({
      mode: 'reduced',
      km: 3,
    })
    expect(adjust({ t: 'long', lab: 'Longrun', km: 20, d: '' }, lvl(1)).note).toMatch(
      /Longrun um 20 %/,
    )
  })

  it('replaces training at level 2', () => {
    expect(adjust({ t: 'easy', lab: 'Locker', km: 10, d: '' }, lvl(2))).toMatchObject({
      mode: 'rest',
      title: 'Heute Pause',
    })
    expect(adjust({ t: 'q', lab: 'Intervalle', km: 20, d: '' }, lvl(2))).toMatchObject({
      mode: 'swap',
      km: 8,
    })
    expect(adjust({ t: 'long', lab: 'Longrun', km: 30, d: '' }, lvl(2))).toMatchObject({
      mode: 'swap',
      km: 12,
    })
  })
})
