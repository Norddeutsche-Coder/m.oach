import { addD, fp, iso, parse } from '../../lib/format'
import type { PlannedRun, Run, RunAnalysis, RunContext, RunFinding, RunKind } from './types'

const RUN_KINDS: readonly string[] = ['easy', 'q', 'long', 'race']

/** Rounds to `n` decimals and uses a decimal comma, without trailing zeros. */
const dec = (x: number, n: number): string =>
  (Math.round(x * 10 ** n) / 10 ** n).toString().replace('.', ',')

const r1 = (x: number): number => Math.round(x * 10) / 10

const mean = (values: readonly (number | null | undefined)[]): number | null => {
  const a = values.filter((x): x is number => x != null)
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null
}

const fmtPct = (x: number): string =>
  (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1).replace('.', ',') + ' %'

const paceOf = (run: Run): number | null => (run.km > 0 && run.sec > 0 ? run.sec / run.km : null)

/** Kind of a run: the planned run type if there is one, otherwise derived from distance and pace. */
export function runKind(run: Run, ctx: RunContext, planDay: PlannedRun | null): RunKind {
  if (planDay && planDay.km && planDay.t != 'rest' && RUN_KINDS.includes(planDay.t)) {
    return planDay.t as RunKind
  }
  const pc = paceOf(run)
  if (ctx.k80 && run.km >= Math.max(14, ctx.k80 * 0.95)) return 'long'
  if (pc && ctx.med && run.km >= 4 && pc < ctx.med * 0.93) return 'q'
  return 'easy'
}

/** Analysis of a single run against plan, pace zones, heart rate and the previous six weeks. */
export function analyzeRun(run: Run, ctx: RunContext): RunAnalysis {
  const pc = paceOf(run)
  const d = parse(run.d)
  const p = ctx.pf ? ctx.pf(d) : null
  const kind = runKind(run, ctx, p)
  const z = ctx.zones ? ctx.zones(d) : null
  const good: string[] = []
  const bad: RunFinding[] = []
  const nxt: string[] = []
  const note: string[] = []
  const B = (k: RunFinding['k'], t: string, n?: string) => {
    bad.push({ k, t })
    if (n) nxt.push(n)
  }

  if (pc && kind == 'easy') {
    if (z) {
      if (pc >= z.e1 * 0.97) good.push('Tempo im lockeren Bereich (' + fp(pc) + ' /km)')
      else
        B(
          'fast',
          'Zu schnell für einen lockeren Lauf: ' +
            fp(pc) +
            ' statt ' +
            fp(z.e1) +
            '–' +
            fp(z.e2) +
            ' /km',
          'Die ersten 3 km bewusst langsamer, im Gesprächstempo bleiben.',
        )
    } else if (ctx.med && pc < ctx.med * 0.95) {
      B(
        'fast',
        'Schneller als dein üblicher Schnitt (' + fp(pc) + ' statt ' + fp(ctx.med) + ' /km)',
        'Lockere Läufe bewusst langsam beginnen.',
      )
    }
  }

  if (p && p.km && p.t != 'rest' && ctx.pf) {
    const q = run.km / p.km
    if (q >= 0.9 && q <= 1.1)
      good.push('Umfang wie geplant (' + dec(run.km, 1) + ' von ' + r1(p.km) + ' km)')
    else if (q > 1.15)
      B(
        'long',
        'Länger als geplant: ' + dec(run.km, 1) + ' statt ' + r1(p.km) + ' km',
        'Den geplanten Umfang einhalten. Mehr bringt nicht automatisch mehr.',
      )
    else if (q < 0.8)
      B(
        'short',
        'Gekürzt: nur ' + dec(run.km, 1) + ' von ' + r1(p.km) + ' km',
        'Wenn du kürzen musst, lieber einen lockeren Lauf auslassen als die Qualität.',
      )
  }

  if (p && p.t == 'rest' && ctx.pf)
    B('rest', 'Lauf an einem geplanten Ruhetag', 'Ruhetage einhalten: Dort passiert die Anpassung.')

  if (run.hr && ctx.hrmax) {
    const pct = (run.hr / ctx.hrmax) * 100
    if (kind == 'easy') {
      if (pct <= 76)
        good.push('Puls entspannt (' + Math.round(pct) + ' % der höchsten gemessenen Frequenz)')
      else if (pct >= 83)
        B(
          'hr',
          'Puls hoch für einen lockeren Lauf (' + Math.round(pct) + ' % der höchsten Frequenz)',
          'Langsamer starten. Hitze, Müdigkeit, Koffein und Stress treiben den Puls.',
        )
    } else if (kind == 'q' && pct >= 82) {
      good.push('Intensität passend: Ø Puls ' + Math.round(pct) + ' % der höchsten Frequenz')
    }
  }

  const rpe = run.rpe
  if (rpe && rpe > 0) {
    if (kind == 'easy' && rpe >= 7)
      B(
        'rpe',
        'Anstrengung ' + rpe + '/10 ist für einen lockeren Lauf zu hoch',
        'Gefühl über Tempo stellen: lockere Läufe dürfen sich leicht anfühlen.',
      )
    else if (kind == 'easy' && rpe <= 4) good.push('Locker gelaufen (Anstrengung ' + rpe + '/10)')
    else if (rpe >= 9)
      B('rpe', 'Sehr hart (Anstrengung ' + rpe + '/10)', 'Danach ein lockerer oder freier Tag.')
  }

  const from = iso(addD(d, -42))
  const before = ctx.runs.filter((x) => x.d < run.d && x.d >= from)

  // Efficiency: speed in m/s per heartbeat, compared with the mean of the previous six weeks.
  if (run.hr && pc && run.km >= 4) {
    const ef = (x: Run) => 1000 / (x.sec / x.km) / (x.hr as number)
    const bs = before.filter((x) => x.hr && x.km >= 4 && x.sec > 0).map(ef)
    if (bs.length >= 4) {
      const e0 = mean(bs) as number
      const dl = (ef(run) / e0 - 1) * 100
      if (dl >= 2.5)
        good.push('Effizienter als dein Schnitt: ' + fmtPct(dl) + ' Tempo pro Herzschlag')
      else if (dl <= -5)
        B(
          'eff',
          'Weniger effizient als sonst (' + fmtPct(dl) + ' Tempo pro Herzschlag)',
          'Schlaf, Hitze und Flüssigkeit prüfen. Hängt es an, die Woche entschärfen.',
        )
    }
  }

  if (run.ld) {
    const ls = before.filter((x) => x.ld).map((x) => x.ld)
    if (ls.length >= 4) {
      const b = mean(ls) as number
      if (run.ld > b * 1.5)
        B(
          'load',
          'Hohe Trainingslast (' + run.ld + ', Ø ' + Math.round(b) + ')',
          'Danach einen lockeren oder freien Tag einplanen.',
        )
    }
  }

  let st = 0
  for (let i = 1; i <= 7; i++) {
    const day = iso(addD(d, -i))
    if (ctx.runs.some((x) => x.d == day)) st++
    else break
  }
  if (st >= 5) B('streak', st + 1 + '. Lauftag in Folge', 'Einen freien Tag einplanen.')

  if (run.el && run.km > 0 && run.el / run.km >= 15)
    note.push(
      'Hügelig (' +
        Math.round(run.el / run.km) +
        ' m pro km): Das Tempo ist nicht direkt mit flachen Läufen vergleichbar.',
    )
  if (kind == 'long' && run.km >= 18)
    nxt.push(
      'Verpflegung wie im Wettkampf üben: ab Minute 40 alle 20–30 min rund 25 g Kohlenhydrate.',
    )

  if (!good.length)
    good.push(run.manual ? 'Lauf eingetragen. Konstanz zählt.' : 'Lauf absolviert. Konstanz zählt.')
  if (!nxt.length)
    nxt.push(
      kind == 'q'
        ? 'Morgen locker laufen oder frei. Die Qualität wirkt erst mit Erholung.'
        : kind == 'long'
          ? 'Heute Kohlenhydrate, Eiweiß und Schlaf priorisieren.'
          : kind == 'race'
            ? 'Ein paar lockere Tage, bevor du wieder Tempo läufst.'
            : 'Weiter so. Die nächste Einheit wie geplant.',
    )

  const v: RunAnalysis['v'] =
    bad.length == 0
      ? { t: 'Stark', c: 'g' }
      : bad.length == 1
        ? { t: 'Gut', c: 'y' }
        : { t: 'Achtung', c: 'r' }
  return {
    kind,
    good: good.slice(0, 3),
    bad: bad.slice(0, 3),
    nxt: nxt.slice(0, 3),
    note,
    v,
    pc,
  }
}
