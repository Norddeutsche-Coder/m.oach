import { mon, parse } from '../../lib/format'
import { calendarDays } from './paces'
import type { StrengthMeta, StrengthSchedule } from './types'

const calendarWeeks = (from: Date, to: Date): number => calendarDays(mon(from), mon(to)) / 7

/** Strength session for a day, or null from race week on. */
export function strengthSession(date: Date, schedule: StrengthSchedule): StrengthMeta | null {
  const weeksToRace = calendarWeeks(date, parse(schedule.race))
  if (weeksToRace < 1) return null
  const { strD } = schedule
  let s: StrengthMeta['s']
  if (strD.length >= 2) {
    // A day that is not a configured strength day counts as the first one.
    const weekday = (date.getDay() + 6) % 7
    s = Math.max(0, strD.indexOf(weekday)) === 0 ? 'A' : 'B'
  } else {
    // JS remainder keeps the sign, so weeks before the start alternate as B, A, B, ...
    s = calendarWeeks(parse(schedule.start), date) % 2 === 0 ? 'A' : 'B'
  }
  return { s, n: weeksToRace <= 3 ? 2 : 3 }
}
