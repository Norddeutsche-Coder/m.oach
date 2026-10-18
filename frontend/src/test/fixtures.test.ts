import { afterEach, describe, expect, it, vi } from 'vitest'
import { day, makeState, setFixedSystemTime } from './fixtures'

describe('test state fixtures', () => {
  afterEach(() => vi.useRealTimers())

  it('creates a complete default state', () => {
    expect(makeState()).toEqual({
      start: null,
      runs: [],
      rd: 42.195,
      goalT: null,
      noPlan: false,
      hist: [],
      race: '2027-09-26',
      goal: 9900,
      base: 11400,
      res: [],
      log: {},
      chk: {},
      well: {},
      prof: {},
    })
  })

  it('creates independent nested data for every state', () => {
    const first = makeState()
    const second = makeState()

    expect(first.runs).not.toBe(second.runs)
    expect(first.hist).not.toBe(second.hist)
    expect(first.res).not.toBe(second.res)
    expect(first.log).not.toBe(second.log)
    expect(first.chk).not.toBe(second.chk)
    expect(first.well).not.toBe(second.well)
    expect(first.prof).not.toBe(second.prof)
  })

  it('overrides individual top-level fields', () => {
    const state = makeState({ start: '2026-10-12', noPlan: true, goal: 10800 })

    expect(state).toMatchObject({ start: '2026-10-12', noPlan: true, goal: 10800 })
    expect(state.runs).toEqual([])
    expect(state.race).toBe('2027-09-26')
  })
})

describe('local date fixtures', () => {
  afterEach(() => vi.useRealTimers())

  it('creates a local calendar day', () => {
    const date = day('2026-10-16')

    expect([
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    ]).toEqual([2026, 9, 16, 0, 0, 0])
  })

  it('sets a fixed system time at noon by default', () => {
    const cleanup = setFixedSystemTime('2026-10-16')

    expect([
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      new Date().getHours(),
    ]).toEqual([2026, 9, 16, 12])

    cleanup()
    expect(vi.isFakeTimers()).toBe(false)
  })

  it('sets a fixed system time at the requested hour', () => {
    const cleanup = setFixedSystemTime('2026-10-16', 10)

    expect([
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      new Date().getHours(),
    ]).toEqual([2026, 9, 16, 10])

    cleanup()
  })
})
