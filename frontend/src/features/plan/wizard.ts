export interface LongRunOptions {
  /** "Ausdauer erhalten": constant volume, no taper and no small-volume rule. */
  maintain?: boolean
}

// Mirrors the plan generator in legacy/app.js: the long run is 25–40 % of the weekly volume (`ls`).
const longRunShare = (peak: number, cap: number) => Math.max(0.25, Math.min(0.4, cap / peak))

/** Upper limit of a long run by the 25–40 % rule, also used for the taper weeks before the race. */
export function longRunLimit(peak: number, cap: number): number {
  return Math.min(cap, Math.round(peak * longRunShare(peak, cap)))
}

/** Longest run the plan schedules in its peak weeks. Race plans below 30 km/week use a quarter. */
export function plannedLongRun(peak: number, cap: number, options: LongRunOptions = {}): number {
  if (!options.maintain && peak < 30) return Math.round(peak * 0.25)
  return longRunLimit(peak, cap)
}

/**
 * Upper limit of the taper long runs. Above half the peak the plan keeps the length named in the hint,
 * otherwise the 25–40 % rule applies so that previously allowed plans stay unchanged.
 */
export function taperLongRunLimit(peak: number, cap: number): number {
  return cap > peak * 0.5 ? plannedLongRun(peak, cap) : longRunLimit(peak, cap)
}

/** Non-blocking hint when the longest run is more than half of the peak volume, otherwise null. */
export function longRunHint(
  peak: number,
  cap: number,
  options: LongRunOptions = {},
): string | null {
  if (!(peak > 0 && cap > peak * 0.5)) return null
  const km = plannedLongRun(peak, cap, options)
  if (options.maintain)
    return `Hinweis: Dein längster Lauf ist mehr als die Hälfte deines Wochenumfangs. Im Plan wird er etwa ${km} km lang, weil ein Lauf höchstens 40 % des Wochenumfangs ausmacht.`
  const reason =
    peak < 30
      ? 'weil der längste Lauf bei weniger als 30 km pro Woche ein Viertel des Wochenumfangs ist'
      : 'weil ein Lauf höchstens 40 % des Wochenumfangs ausmacht'
  return `Hinweis: Dein längster Lauf ist mehr als die Hälfte deines Höchstumfangs. Im Plan wird er in den umfangreichsten Wochen etwa ${km} km lang, ${reason}.`
}
