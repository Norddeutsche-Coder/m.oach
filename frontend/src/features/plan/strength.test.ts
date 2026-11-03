import { describe, expect, it } from 'vitest'
import { parse } from '../../lib/format'
import { strengthSession } from './strength'

type Schedule = Parameters<typeof strengthSession>[1]

// Weekday indices: Monday = 0 … Sunday = 6.
const MON = 0
const TUE = 1
const WED = 2
const FRI = 4

// Start on Monday 2026-03-16, race on Sunday 2026-06-14 (race week starts Monday 2026-06-08).
// The weeks from 2026-03-23 to 2026-03-30 cross the European daylight-saving change (2026-03-29).
const plan = (strD: readonly number[]): Schedule => ({
  strD,
  start: '2026-03-16',
  race: '2026-06-14',
})

const session = (day: string, schedule: Schedule) => strengthSession(parse(day), schedule)?.s

describe('strengthSession with two or more strength days per week', () => {
  it('assigns A to the first and B to the second configured strength day', () => {
    const schedule = plan([TUE, FRI])

    expect(session('2026-03-17', schedule)).toBe('A')
    expect(session('2026-03-20', schedule)).toBe('B')
    expect(session('2026-04-28', schedule)).toBe('A')
    expect(session('2026-05-01', schedule)).toBe('B')
  })

  it('follows the configured order rather than the weekday order', () => {
    const schedule = plan([FRI, TUE])

    expect(session('2026-03-20', schedule)).toBe('A')
    expect(session('2026-03-17', schedule)).toBe('B')
  })

  it('assigns B to a third strength day', () => {
    const schedule = plan([MON, WED, FRI])

    expect(session('2026-03-16', schedule)).toBe('A')
    expect(session('2026-03-18', schedule)).toBe('B')
    expect(session('2026-03-20', schedule)).toBe('B')
  })

  it('falls back to A for a day that is not a configured strength day', () => {
    expect(session('2026-03-18', plan([TUE, FRI]))).toBe('A')
  })
})

describe('strengthSession with fewer than two strength days per week', () => {
  it('alternates A and B weekly with one strength day, starting with A in the start week', () => {
    const schedule = plan([WED])

    expect(session('2026-03-18', schedule)).toBe('A')
    expect(session('2026-03-25', schedule)).toBe('B')
    expect(session('2026-04-01', schedule)).toBe('A')
    expect(session('2026-04-08', schedule)).toBe('B')
  })

  it('counts calendar weeks from the Monday of the start week', () => {
    const schedule: Schedule = { strD: [MON], start: '2026-03-18', race: '2026-06-14' }

    expect(session('2026-03-16', schedule)).toBe('A')
    expect(session('2026-03-23', schedule)).toBe('B')
  })

  it('also alternates weekly without any configured strength day', () => {
    const schedule = plan([])

    expect(session('2026-03-16', schedule)).toBe('A')
    expect(session('2026-03-23', schedule)).toBe('B')
    expect(session('2026-03-30', schedule)).toBe('A')
  })

  it('assigns B to the week before the start week', () => {
    expect(session('2026-03-11', plan([WED]))).toBe('B')
  })
})

describe('strengthSession sets', () => {
  const schedule = plan([TUE, FRI])
  const sets = (day: string) => strengthSession(parse(day), schedule)?.n

  it('uses 3 sets four or more weeks before race week', () => {
    expect(sets('2026-03-17')).toBe(3)
    expect(sets('2026-05-15')).toBe(3)
  })

  it('uses 2 sets in the last three weeks before race week', () => {
    expect(sets('2026-05-19')).toBe(2)
    expect(sets('2026-05-26')).toBe(2)
    expect(sets('2026-06-05')).toBe(2)
  })

  it('counts weeks to race across the autumn daylight-saving change', () => {
    // Race on Sunday 2026-11-01; race week starts Monday 2026-10-26, right after the change
    // on 2026-10-25.
    const autumn: Schedule = { strD: [TUE, FRI], start: '2026-09-07', race: '2026-11-01' }

    expect(strengthSession(parse('2026-09-29'), autumn)).toEqual({ s: 'A', n: 3 })
    expect(strengthSession(parse('2026-10-06'), autumn)).toEqual({ s: 'A', n: 2 })
    expect(strengthSession(parse('2026-10-23'), autumn)).toEqual({ s: 'B', n: 2 })
    expect(strengthSession(parse('2026-10-27'), autumn)).toBeNull()
  })
})

describe('strengthSession around the race', () => {
  const schedule = plan([TUE, FRI])

  it('returns the full session meta for a regular strength day', () => {
    expect(strengthSession(parse('2026-06-05'), schedule)).toEqual({ s: 'B', n: 2 })
  })

  it('gives no strength hint in race week', () => {
    expect(strengthSession(parse('2026-06-08'), schedule)).toBeNull()
    expect(strengthSession(parse('2026-06-09'), schedule)).toBeNull()
    expect(strengthSession(parse('2026-06-14'), schedule)).toBeNull()
  })

  it('gives no strength hint after the race', () => {
    expect(strengthSession(parse('2026-06-15'), schedule)).toBeNull()
    expect(strengthSession(parse('2026-06-23'), schedule)).toBeNull()
  })
})
