import { describe, expect, it } from 'vitest'
import { cloudStatesMatch, nextCloudRevision } from './conflict'

describe('cloudStatesMatch', () => {
  it('matches equal cloud states', () => {
    const state = {
      prof: { name: 'Testläufer', wake: '06:30' },
      log: { '2026-10-18': { rpe: '7', note: 'Lockerer Lauf' } },
    }

    expect(cloudStatesMatch(state, structuredClone(state))).toBe(true)
  })

  it('detects nested changes', () => {
    const local = { prof: { name: 'Lokal' }, log: { '2026-10-18': { rpe: '7' } } }
    const cloud = { prof: { name: 'Cloud' }, log: { '2026-10-18': { rpe: '7' } } }

    expect(cloudStatesMatch(local, cloud)).toBe(false)
  })

  it('ignores revision metadata at every nesting level', () => {
    const local = { _m: 10, prof: { name: 'Testläufer', _m: 20 } }
    const cloud = { _m: 999, prof: { name: 'Testläufer', _m: 1000 } }

    expect(cloudStatesMatch(local, cloud)).toBe(true)
  })
})

describe('nextCloudRevision', () => {
  it('returns a finite integer newer than the local, cloud and current revisions', () => {
    expect(nextCloudRevision(100, 200, 300)).toBe(301)
  })

  it('advances beyond a cloud clock that is far ahead', () => {
    const revision = nextCloudRevision(100, 9_000_000_000_000, 200)

    expect(Number.isFinite(revision)).toBe(true)
    expect(Number.isInteger(revision)).toBe(true)
    expect(revision).toBeGreaterThan(100)
    expect(revision).toBeGreaterThan(9_000_000_000_000)
  })
})
