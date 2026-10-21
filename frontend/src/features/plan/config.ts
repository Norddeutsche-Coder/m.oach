import { addD, mon, parse } from '../../lib/format'
import { taperLongRunLimit } from './wizard'
import type {
  DeloadConfig,
  PhaseConfig,
  PlanConfig,
  PlanConfigInput,
  PlanRole,
  TaperConfig,
  VolumeConfig,
  VolumePoint,
} from './types'

export type { PlanConfig, PlanConfigInput } from './types'

const TAPER_VARIANTS = [
  { volume: [], longRun: [] },
  { volume: [0.6], longRun: [0.55] },
  { volume: [0.5, 0.7], longRun: [0.45, 0.65] },
  { volume: [0.42, 0.6, 0.8], longRun: [0.41, 0.53, 0.71] },
] as const

const ROLE_WEIGHTS: Partial<Record<PlanRole, number>> = {
  easy: 0.19,
  str: 0.16,
  q1: 0.22,
  q2: 0.22,
}

const clamp = (value: number, lower: number, upper: number): number =>
  Math.max(lower, Math.min(upper, value))

function sameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function calendarWeekDifference(start: Date, end: Date): number {
  let cursor = mon(start)
  const target = mon(end)
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(target.getTime())) return Number.NaN
  const direction = cursor <= target ? 1 : -1
  let weeks = 0

  while (!sameCalendarDay(cursor, target)) {
    cursor = addD(cursor, direction * 7)
    weeks += direction
  }

  return weeks
}

export function buildCfg(input: PlanConfigInput): PlanConfig {
  const taper = clamp(Math.round(+input.tp) || 3, 1, 4)
  const maintain = input.type === 'maintain'
  const start = parse(input.start)
  const end = maintain ? addD(mon(start), input.weeks * 7 - 1) : parse(input.race)
  const totalWeeks = calendarWeekDifference(start, end)
  const roles: PlanRole[] = Array<PlanRole>(7).fill('rest')

  for (let day = 0; day < 7; day += 1) {
    if (!input.rest.includes(day)) roles[day] = 'easy'
  }
  roles[input.lg] = 'long'

  const sequence: Array<{ day: number; distance: number }> = []
  for (let distance = 1; distance < 7; distance += 1) {
    const day = (input.lg + distance) % 7
    if (roles[day] !== 'rest') sequence.push({ day, distance })
  }

  let strengthDay: { day: number; distance: number } | undefined
  if (sequence.length >= 3) {
    strengthDay = sequence.find(({ distance }) => distance === 5) ?? sequence.at(-1)
    if (strengthDay) roles[strengthDay.day] = 'str'
  }

  const qualityCandidates = sequence.filter(
    ({ day, distance }) => distance !== 1 && day !== strengthDay?.day,
  )
  const firstQuality = qualityCandidates[0]
  if (firstQuality) {
    roles[firstQuality.day] = 'q1'
    const secondQuality = qualityCandidates.find(
      ({ distance }) => distance >= firstQuality.distance + 2,
    )
    if (secondQuality) roles[secondQuality.day] = 'q2'
  }

  if (maintain) {
    const secondQuality = roles.indexOf('q2')
    if (input.q < 2 && secondQuality >= 0) roles[secondQuality] = 'easy'
    const firstQualityIndex = roles.indexOf('q1')
    if (input.q < 1 && firstQualityIndex >= 0) roles[firstQualityIndex] = 'easy'
  }

  const weights = roles.map((role) => ROLE_WEIGHTS[role] ?? 0)
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || 1
  const normalizedWeights = weights.map((weight) => weight / weightSum)
  const strengthDays = sequence
    .filter(
      ({ day, distance }) => distance !== 1 && (roles[day] === 'easy' || roles[day] === 'str'),
    )
    .slice(0, input.str)
    .map(({ day }) => day)
  const taperVariant = TAPER_VARIANTS[taper - 1]
  const taperLongRuns = taperVariant.longRun.map((share) =>
    Math.min(Math.round(input.cap * share), taperLongRunLimit(input.peak, input.cap)),
  )

  if (maintain) {
    return {
      tw: totalWeeks,
      T: [totalWeeks + 1, 0, 0, 0, 0],
      S: 0,
      A: [[totalWeeks, input.cur]],
      cap: input.cap,
      ls: clamp(input.cap / input.cur, 0.25, 0.4),
      tl: taperLongRuns,
      roles,
      W: normalizedWeights,
      strD: strengthDays,
      test: -1,
      recov: -1,
      first: 999,
      fw: [],
      mul: false,
      mode: 'maintain',
    }
  }

  const initialSpecificWeeks = clamp(Math.round(totalWeeks * 0.265), 6, 13)
  const finalThreshold = taper + initialSpecificWeeks
  const testThreshold = finalThreshold + 4
  const buildWeeks = totalWeeks - testThreshold + 1
  const hasTest = totalWeeks >= 24 && buildWeeks >= 8
  let thresholds: PlanConfig['T']
  let specificWeeks: number

  if (hasTest) {
    const distributedWeeks = buildWeeks - 1
    const foundationWeeks = Math.round(distributedWeeks * 0.36)
    const tempoWeeks = Math.round(distributedWeeks * 0.3)
    const foundationThreshold = totalWeeks - foundationWeeks + 1
    const tempoThreshold = foundationThreshold - tempoWeeks
    thresholds = [
      totalWeeks + 1,
      foundationThreshold,
      tempoThreshold,
      testThreshold,
      finalThreshold,
    ]
    specificWeeks = initialSpecificWeeks
  } else {
    specificWeeks = clamp(Math.round(totalWeeks * 0.5), 4, 13)
    const sharedThreshold = taper + specificWeeks
    thresholds = [
      totalWeeks + 1,
      sharedThreshold,
      sharedThreshold,
      sharedThreshold,
      sharedThreshold,
    ]
  }

  const supportPoints: VolumePoint[] = [
    [Math.max(totalWeeks, taper + 1), input.cur],
    [taper, input.peak],
  ]
  for (let index = 0; index < taper - 1; index += 1) {
    supportPoints.push([
      taper - 1 - index,
      Math.round(input.peak * taperVariant.volume[taper - 2 - index]),
    ])
  }
  supportPoints.push([0, Math.round(input.peak * 0.375)])

  return {
    tw: totalWeeks,
    T: thresholds,
    S: specificWeeks,
    A: supportPoints,
    cap: input.cap,
    ls: clamp(input.cap / input.peak, 0.25, 0.4),
    tl: taperLongRuns,
    roles,
    W: normalizedWeights,
    strD: strengthDays,
    test: hasTest ? testThreshold : -1,
    recov: hasTest ? testThreshold - 1 : -1,
    first: 999,
    fw: [],
    mul: true,
    tp: taper,
    tv: 2,
  }
}

export function taperWeeks(config: TaperConfig): number {
  if (config.tp == null) return 4
  return (config.tv ?? Number.NEGATIVE_INFINITY) >= 2 ? config.tp : config.tp + 1
}

export function volume(config: VolumeConfig, weeksToRace: number): number {
  const supportPoints = config.A
  if (weeksToRace >= supportPoints[0][0]) return supportPoints[0][1]
  if (weeksToRace <= 0) return supportPoints[supportPoints.length - 1][1]

  for (let index = 0; index < supportPoints.length - 1; index += 1) {
    const [upperWeek, upperVolume] = supportPoints[index]
    const [lowerWeek, lowerVolume] = supportPoints[index + 1]
    if (weeksToRace <= upperWeek && weeksToRace >= lowerWeek) {
      return upperWeek === lowerWeek
        ? upperVolume
        : lowerVolume +
            ((upperVolume - lowerVolume) * (weeksToRace - lowerWeek)) / (upperWeek - lowerWeek)
    }
  }

  return supportPoints[supportPoints.length - 1][1]
}

export function phase(config: PhaseConfig, weeksToRace: number, raceDistance: number): string {
  if (config.mode === 'maintain') return 'Erhaltung'
  const thresholds = config.T
  if (weeksToRace >= thresholds[0]) return 'Regeneration'
  if (weeksToRace >= thresholds[1]) return 'Grundlagen'
  if (weeksToRace >= thresholds[2]) return 'Tempoentwicklung'
  if (weeksToRace >= thresholds[3]) return 'Schwelle & Test'
  if (weeksToRace >= thresholds[4]) return 'Entlastung + Basis'
  if (weeksToRace >= taperWeeks(config)) {
    return raceDistance < 30 ? 'Wettkampfspezifisch' : 'Marathonspezifisch'
  }
  return 'Tapering'
}

export function isDeload(config: DeloadConfig, weeksToRace: number): boolean {
  if (config.mode === 'maintain') return (config.tw - weeksToRace) % 4 === 3
  return (
    weeksToRace > taperWeeks(config) + 1 &&
    weeksToRace < config.T[0] &&
    weeksToRace !== config.test &&
    weeksToRace !== config.recov &&
    (config.tw - weeksToRace) % 4 === 3
  )
}
