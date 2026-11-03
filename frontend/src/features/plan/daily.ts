import { addD, fp, ft, iso, mon, parse } from '../../lib/format'
import { isDeload, taperWeeks, volume } from './config'
import { calendarDays } from './paces'
import type { DailyPlanInput, DayContext, DayPlan, PlanConfig } from './types'

const MARATHON_KM = 42.195
const STRENGTH = 'Kraft zu Hause 20–25 min: einbeinige Kniebeuge, Hip Thrust, Wadenheben, Plank'
const rest = (): DayPlan => ({
  t: 'rest',
  lab: 'Recovery',
  km: 0,
  d: 'Ruhetag. Optional 15 min Mobility.',
})

const r1 = (x: number): number => Math.round(x * 10) / 10
const weekday = (date: Date): number => (date.getDay() + 6) % 7
const isShort = (raceDistance: number): boolean => raceDistance < 30
/** Last week before race week that still counts as taper. */
const lastTaperWeek = (config: PlanConfig): number => taperWeeks(config) - 1
const racePace = (ctx: DayContext): number => ctx.goalTime / ctx.raceDistance

/** Calendar weeks from the Monday of `date` to the Monday of race week. */
export function weeksToRace(race: string, date: Date): number {
  return calendarDays(mon(date), mon(parse(race))) / 7
}

/** Planned weekly volume for the week of the day, including deload, week factor and adaptation. */
export function dayVolume(input: DailyPlanInput): number {
  const { config, date, today } = input
  const w = weeksToRace(input.race, date)
  let v = volume(config, w)
  if (config.mul) {
    if (w === config.test) v *= 0.95
    else if (w === config.recov) v *= 0.78
  }
  if (isDeload(config, w)) v *= 0.78
  v *= input.weekFactor
  if (!input.withoutAdaptation && date >= today && date <= addD(today, 13)) {
    v *= input.adaptationFactor
  }
  return v
}

/** Long run distance: share of the weekly volume, fixed distances in the taper weeks. */
export function longRunKm(config: PlanConfig, weeksToRace: number, volume: number): number {
  let km =
    volume < 30 ? Math.round(volume * 0.25) : Math.min(config.cap, Math.round(volume * config.ls))
  const taperLong = config.tl[weeksToRace - 1]
  if (weeksToRace >= 1 && weeksToRace <= lastTaperWeek(config) && taperLong != null) km = taperLong
  return km
}

export function easyRun(ctx: DayContext, km: number, extra = ''): DayPlan {
  const { e1, e2 } = ctx.zones
  const double = ctx.volume >= 100 && km >= 14 ? ' · Doppeleinheit möglich (AM/PM)' : ''
  return {
    t: 'easy',
    lab: 'Locker',
    km,
    str: ctx.strength,
    d: `${km} km locker @ ${fp(e1)}–${fp(e2)} /km${extra}${double}`,
  }
}

/** Quality session of the phase; recovery phases and the recovery week get an easy run. */
export function qualityRun(ctx: DayContext, role: 'q1' | 'q2', km: number): DayPlan {
  const { config, weeksToRace: w, zones: z } = ctx
  const T = config.T
  const N = lastTaperWeek(config)
  const short = isShort(ctx.raceDistance)
  const first = role === 'q1'
  const Q = (lab: string, text: string): DayPlan => ({
    t: 'q',
    lab,
    km,
    str: ctx.strength,
    d: `${km} km gesamt: ${text}`,
  })

  if (w >= T[0] || w === config.recov) return easyRun(ctx, km)
  if (w >= T[1]) {
    return first
      ? Q('Hügel', 'locker, davon 8 × 60 s bergauf kräftig (Trabpause)')
      : Q('Fahrtspiel', `6 × 2 min zügig (${fp(z.t)}), je 2 min locker`)
  }
  if (w >= T[2]) {
    const n = 6 + ((T[1] - 1 - w) % 3)
    return first
      ? Q('Intervalle', `Einlaufen + ${n} × 1000 m @ ${fp(z.i)} (90 s Pause)`)
      : Q('Tempo', `20 min @ ${fp(z.t)} (Schwelle) im Lauf`)
  }
  if (w >= T[3]) {
    // Known bug TG-20: with few kilometres the tempo share is ≤ 0 km.
    return first
      ? Q('Schwelle', `4 × 2 km @ ${fp(z.t)} (2 min Pause)`)
      : Q('Tempo-DL', `${Math.min(km - 4, 8 + (T[2] - 1) - w, 14)} km @ ${fp(z.t)}`)
  }
  if (w >= T[4]) {
    return first
      ? Q('Intervalle', `5 × 1000 m @ ${fp(z.i)} (90 s Pause)`)
      : Q('Tempo-DL', `${Math.min(10, km - 4)} km @ ${fp(z.t)}`)
  }
  if (w > N) {
    if (short && first) {
      const K = ctx.raceDistance
      const seg = K >= 20 ? 2000 : K >= 8 ? 1000 : 600
      const top = N + config.S
      const n0 =
        K >= 20
          ? 3 + Math.floor((top - w) / 3)
          : K >= 8
            ? 5 + Math.floor((top - w) / 2)
            : 6 + Math.floor((top - w) / 2)
      const nmax = K >= 20 ? 6 : K >= 8 ? 8 : 10
      const n = Math.max(2, Math.min(Math.min(nmax, n0), Math.floor(((km - 4) * 1000) / seg)))
      const pause = seg >= 2000 ? '2 min' : '90 s'
      return Q('Racepace', `Einlaufen + ${n} × ${seg} m @ ${fp(racePace(ctx))} (${pause} Pause)`)
    }
    const m = Math.max(10, Math.min(20, Math.round(8 + (N + config.S - w) * 1.1)))
    return first
      ? Q(
          'MRT-Block',
          `${Math.min(m, km - 4)} km @ ${fp(z.mp)} in 2–3 Blöcken (1 km locker dazwischen)`,
        )
      : Q('Schwelle', `3 × 3 km @ ${fp(z.t)} (2 min Pause)`)
  }
  if (w >= 1) {
    if (short && first) {
      return Q('Racepace', `${w >= 3 ? 4 : 3} × 1000 m @ ${fp(racePace(ctx))} (2 min Pause)`)
    }
    return first
      ? Q('MRT', `${w >= 3 ? 10 : 8} km @ ${fp(z.mp)}`)
      : Q('Schärfe', `5 × 1000 m @ ${fp(z.i)}`)
  }
  return first
    ? Q('Aktivierung', `3 × 2 min @ ${fp(short ? racePace(ctx) : z.mp)}`)
    : easyRun(ctx, km, ' + Steigerungsläufe')
}

/** Long run of the phase; the test week replaces it with the test race. */
export function longRun(ctx: DayContext, km: number): DayPlan {
  const { config, weeksToRace: w, zones: z } = ctx
  const N = lastTaperWeek(config)
  const easyPaces = `${fp(z.e1)}–${fp(z.e2)}`
  if (w === config.test) {
    const testKm = ctx.raceDistance >= 15 ? 10 : 5
    const target = ft(ctx.goal * Math.pow(testKm / MARATHON_KM, 1.06))
    return {
      t: 'race',
      lab: 'Testlauf',
      km: testKm + 5,
      d: `Testwettkampf ${testKm} km (Ziel ca. ${target}) plus Ein-/Auslaufen. Ergebnis unter „Leistung“ eintragen – danach passen sich alle Paces an.`,
    }
  }
  if (w >= config.T[0] || w === config.recov) {
    return { t: 'long', lab: 'Longrun', km, d: `${km} km locker @ ${easyPaces}` }
  }
  if (!isShort(ctx.raceDistance) && w > N && w <= N + config.S && w % 2 === 0) {
    const m = Math.max(8, Math.min(22, Math.round(km * 0.55)))
    return {
      t: 'long',
      lab: 'Longrun MRT',
      km,
      d: `${km} km: locker, die letzten ${m} km @ ${fp(z.mp)}`,
    }
  }
  const fuel = km >= 28 ? ' · Verpflegung üben' : ''
  return { t: 'long', lab: 'Longrun', km, d: `${km} km @ ${easyPaces}${fuel}` }
}

function raceDay(input: DailyPlanInput): DayPlan {
  const K = input.raceDistance
  if (K >= 40) {
    const pace = input.goal / MARATHON_KM
    return {
      t: 'race',
      lab: 'MARATHON',
      km: 42.2,
      d: `Renntag! Ziel ${ft(input.goal)} (${fp(pace)}/km). Erste 10 km kontrolliert bei ca. ${fp(pace * 1.02)}/km.`,
    }
  }
  const pace = input.goalTime / K
  const start =
    K >= 20
      ? `Erste 3 km kontrolliert bei ca. ${fp(pace * 1.02)}/km.`
      : 'Erste 1–2 km nicht schneller als Zielpace, ab Km 3 dranbleiben.'
  return {
    t: 'race',
    lab: K >= 20 ? 'HALBMARATHON' : `${Math.round(K)} KM`,
    km: r1(K),
    d: `Renntag! Ziel ${ft(input.goalTime)} (${fp(pace)}/km). ${start}`,
  }
}

/** Session of a day in a race plan, or null outside the plan period. */
export function dailyPlan(input: DailyPlanInput): DayPlan | null {
  const { config, date } = input
  if (date < input.start || date > parse(input.race)) return null
  if (iso(date) === input.race) return raceDay(input)

  const w = weeksToRace(input.race, date)
  const dw = weekday(date)
  const role = config.roles[dw]
  const v = dayVolume(input)
  const ctx: DayContext = {
    config,
    weeksToRace: w,
    zones: input.zones,
    raceDistance: input.raceDistance,
    goal: input.goal,
    goalTime: input.goalTime,
    volume: v,
    strength: config.strD.includes(dw) && w < config.T[0] ? STRENGTH : '',
  }

  if (role === 'rest') return rest()
  if (w >= config.first) {
    if (config.fw.includes(dw)) return easyRun(ctx, 6)
    if (role === 'long') {
      return { t: 'long', lab: 'Locker', km: 8, d: '8 km ganz locker, Regenerationswoche.' }
    }
    return rest()
  }

  const longKm = longRunKm(config, w, v)
  const km = role === 'long' ? longKm : Math.round(Math.max(0, v - longKm) * config.W[dw])
  if (w === 0 && role === 'long') {
    return easyRun(ctx, Math.min(8, Math.max(4, Math.round(v * 0.15))), ' + Steigerungsläufe')
  }
  if (role === 'easy') return easyRun(ctx, km)
  if (role === 'str') return easyRun(ctx, km, ' + 6 × 20 s Steigerungsläufe')
  if (role === 'q1' || role === 'q2') return qualityRun(ctx, role, km)
  return longRun(ctx, km)
}
