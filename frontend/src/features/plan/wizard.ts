/**
 * Longest run the plan schedules in its peak weeks. Mirrors the plan generator in
 * legacy/app.js: the long run is limited to 25–40 % of the weekly volume (`ls`) and to the cap.
 */
export function plannedLongRun(peak: number, cap: number): number {
  const share = Math.max(0.25, Math.min(0.4, cap / peak))
  return Math.min(cap, Math.round(peak * share))
}

/** Non-blocking hint when the longest run is more than half of the peak volume, otherwise null. */
export function longRunHint(peak: number, cap: number): string | null {
  if (!(peak > 0 && cap > peak * 0.5)) return null
  return `Hinweis: Dein längster Lauf ist mehr als die Hälfte deines Höchstumfangs. Im Plan wird er in den umfangreichsten Wochen etwa ${plannedLongRun(peak, cap)} km lang, weil ein Lauf höchstens 40 % des Wochenumfangs ausmacht.`
}
