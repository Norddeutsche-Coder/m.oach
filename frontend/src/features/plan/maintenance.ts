import { fp, mon } from '../../lib/format'
import { calendarDays } from './paces'
import type { MaintenanceConfig, MaintenanceContext, PlanDay } from './types'

const STRENGTH = 'Kraft zu Hause 20–25 min: einbeinige Kniebeuge, Hip Thrust, Wadenheben, Plank'

/** Planned day of a maintenance plan; every fourth week is a deload week at 80 % volume. */
export function planM(date: Date, config: MaintenanceConfig, context: MaintenanceContext): PlanDay {
  const dw = (date.getDay() + 6) % 7
  const role = config.roles[dw]
  const z = context.zones
  const wk = calendarDays(mon(context.start), mon(date)) / 7
  const deload = wk % 4 === 3
  // Multiply in the legacy order so that rounding stays identical.
  let volume = config.A[0][1]
  if (deload) volume *= 0.8
  volume *= context.weekFactor
  volume *= context.adaptationFactor
  const str = config.strD.includes(dw) ? STRENGTH : ''
  const easy = (km: number, extra = ''): PlanDay => ({
    t: 'easy',
    lab: 'Locker',
    km,
    str,
    d: `${km} km locker @ ${fp(z.e1)}–${fp(z.e2)} /km${extra}`,
  })
  if (role === 'rest')
    return { t: 'rest', lab: 'Recovery', km: 0, d: 'Ruhetag. Optional 15 min Mobility.' }
  const long = Math.min(config.cap, Math.round(volume * config.ls))
  const km = role === 'long' ? long : Math.round(Math.max(0, volume - long) * config.W[dw])
  if (role === 'easy') return easy(km)
  if (role === 'str') return easy(km, ' + 6 × 20 s Steigerungsläufe')
  if (role === 'q1' || role === 'q2') {
    if (deload) return easy(km)
    const quality = (lab: string, text: string): PlanDay => ({
      t: 'q',
      lab,
      km,
      str,
      d: `${km} km gesamt: ${text}`,
    })
    const variant = wk % 3
    if (role === 'q1') {
      if (variant === 0)
        return quality('Fahrtspiel', `6 × 2 min zügig (${fp(z.t)}), je 2 min locker`)
      if (variant === 1) return quality('Tempo', `20 min @ ${fp(z.t)} (Schwelle) im Lauf`)
      return quality('Hügel', 'locker, davon 6 × 60 s bergauf kräftig (Trabpause)')
    }
    if (variant === 0)
      return quality('Intervalle', `Einlaufen + 5 × 800 m @ ${fp(z.i)} (90 s Pause)`)
    if (variant === 1) return quality('Schwelle', `3 × 8 min @ ${fp(z.t)} (2 min Pause)`)
    return quality('Tempo', `15 min @ ${fp(z.t)} im Lauf`)
  }
  return { t: 'long', lab: 'Longrun', km: long, d: `${long} km @ ${fp(z.e1)}–${fp(z.e2)}` }
}
