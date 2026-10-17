import type { Adjustment, Plan, Readiness } from './types'

export const RACE_PACING_NOTE =
  'Erste Kilometer bewusst kontrolliert laufen. Zur Hälfte kurz in dich hineinhören: Fühlt es sich schwer an, nimm Tempo raus. Läuft es stabil, mach so weiter. Fühlst du dich stark, darfst du schneller werden.'

export function adjust(p: Plan, R: Pick<Readiness, 'lvl' | 'pain'>): Adjustment {
  const lv = R.lvl,
    t = p.t,
    km = p.km
  if (t === 'rest')
    return {
      mode: 'plan',
      km: 0,
      title: 'Recovery-Tag',
      note: lv === 2 ? 'Erholung ist heute dein wichtigstes Training.' : '',
    }
  if (R.pain === 2)
    return {
      mode: 'rest',
      km: 0,
      title: 'Heute kein Lauf',
      note: 'Bei deutlichem Schmerz nicht laufen. Wird es in 2–3 Tagen nicht besser, lass es ärztlich oder physiotherapeutisch abklären.',
    }
  if (lv === 0) return { mode: 'plan', km, title: null, note: '' }
  if (t === 'race') {
    // Only the test run can move; race day and tune-up races are fixed dates.
    if (p.lab === 'Testlauf')
      return {
        mode: 'move',
        km: 0,
        title: 'Wettkampf verschieben',
        note: 'Ein Test in angeschlagenem Zustand liefert falsche Paces. Besser 2–4 Tage verschieben.',
      }
    return { mode: 'plan', km, title: null, note: RACE_PACING_NOTE }
  }
  if (lv === 1) {
    const k = Math.max(3, Math.round(km * 0.8))
    return {
      mode: 'reduced',
      km: k,
      title: null,
      note:
        t === 'q'
          ? 'Tempoanteil um etwa ein Drittel kürzen (eine Wiederholung bzw. einen Block weniger), Pausen 30 s länger.'
          : t === 'long'
            ? 'Longrun um 20 % kürzen und die Tempoabschnitte weglassen.'
            : 'Lauf um 20 % kürzen und am langsamen Ende der Tempospanne bleiben.',
    }
  }
  if (t === 'easy')
    return {
      mode: 'rest',
      km: 0,
      title: 'Heute Pause',
      note: 'Besser ein freier Tag oder 20–30 min Spaziergang. Laufen höchstens ganz locker (RPE ≤ 3).',
    }
  if (t === 'q')
    return {
      mode: 'swap',
      km: Math.min(8, Math.round(km * 0.5)),
      title: null,
      note: 'Qualität heute streichen. Stattdessen frei oder ein kurzer, sehr lockerer Lauf. Nicht nachholen, sondern im Plan weitermachen.',
    }
  return {
    mode: 'swap',
    km: Math.min(12, Math.round(km * 0.5)),
    title: null,
    note: 'Longrun heute stark kürzen: höchstens 60–75 min sehr locker, oder verschieben.',
  }
}
