import { describe, expect, it, vi } from 'vitest'
import { buildCfg, isDeload, phase, taperWeeks, volume } from './config'

type ConfigInput = Parameters<typeof buildCfg>[0]
type TestProcess = {
  cwd: () => string
  execPath: string
}
type TestOutput = {
  setEncoding: (encoding: 'utf8') => void
  on: (event: 'data', listener: (chunk: string) => void) => void
}
type TestChildProcess = {
  stdout: TestOutput
  stderr: TestOutput
  kill: (signal: 'SIGKILL') => boolean
  send: (message: string) => boolean
  on: {
    (event: 'message', listener: (message: unknown) => void): void
    (event: 'error', listener: (error: Error) => void): void
    (event: 'close', listener: (code: number | null) => void): void
  }
}
type SpawnTestProcess = (
  executable: string,
  args: string[],
  options: {
    cwd: string
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  },
) => TestChildProcess

const planInput = (overrides: Partial<ConfigInput> = {}): ConfigInput => ({
  type: 'race',
  start: '2026-10-19',
  race: '2027-04-18',
  weeks: 12,
  cur: 50,
  peak: 80,
  cap: 32,
  rest: [0],
  lg: 6,
  str: 2,
  q: 2,
  tp: 3,
  ...overrides,
})

const BUILD_CFG_DEADLINE_MS = 1_500
const CHILD_STARTUP_DEADLINE_MS = 5_000
const buildCfgChildScript = `
  import { createServer } from 'vite'

  const server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } })
  const { buildCfg } = await server.ssrLoadModule('/src/features/plan/config.ts')
  process.send('ready')

  process.once('message', async (serializedInput) => {
    try {
      const config = buildCfg(JSON.parse(serializedInput))
      process.stdout.write(JSON.stringify({ twIsNaN: Number.isNaN(config.tw) }))
    } finally {
      await server.close()
      process.disconnect()
    }
  })
`

async function buildCfgReturnsNaN(input: ConfigInput): Promise<boolean> {
  const { spawn } = await vi.importActual<{ spawn: SpawnTestProcess }>('node:child_process')
  const runtimeProcess = (globalThis as typeof globalThis & { process: TestProcess }).process

  return new Promise((resolve, reject) => {
    const child = spawn(
      runtimeProcess.execPath,
      ['--input-type=module', '--eval', buildCfgChildScript],
      {
        cwd: runtimeProcess.cwd(),
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      },
    )
    let stdout = ''
    let stderr = ''
    let returnDeadline: ReturnType<typeof setTimeout> | undefined
    const startupDeadline = setTimeout(() => {
      child.kill('SIGKILL')
      reject(
        new Error(`buildCfg test process did not start within ${CHILD_STARTUP_DEADLINE_MS} ms`),
      )
    }, CHILD_STARTUP_DEADLINE_MS)

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    child.on('message', (message) => {
      if (message !== 'ready') return
      clearTimeout(startupDeadline)
      returnDeadline = setTimeout(() => {
        child.kill('SIGKILL')
        reject(new Error(`buildCfg did not return within ${BUILD_CFG_DEADLINE_MS} ms`))
      }, BUILD_CFG_DEADLINE_MS)
      child.send(JSON.stringify(input))
    })
    child.on('error', (error) => {
      clearTimeout(startupDeadline)
      clearTimeout(returnDeadline)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(startupDeadline)
      clearTimeout(returnDeadline)
      if (code !== 0) {
        reject(new Error(stderr || `buildCfg subprocess exited with code ${code}`))
        return
      }

      resolve(JSON.parse(stdout).twIsNaN)
    })
  })
}

describe('buildCfg', () => {
  it.each([
    { requested: 1, expected: 1, taperVolumes: [], longRuns: [] },
    { requested: 2, expected: 2, taperVolumes: [[1, 48]], longRuns: [18] },
    {
      requested: 3,
      expected: 3,
      taperVolumes: [
        [2, 56],
        [1, 40],
      ],
      longRuns: [14, 21],
    },
    {
      requested: 4,
      expected: 4,
      taperVolumes: [
        [3, 64],
        [2, 48],
        [1, 34],
      ],
      longRuns: [13, 17, 23],
    },
  ])(
    'builds the $requested-week taper variant',
    ({ requested, expected, taperVolumes, longRuns }) => {
      const config = buildCfg(planInput({ tp: requested }))

      expect(config.tp).toBe(expected)
      expect(taperWeeks(config)).toBe(expected)
      expect(config.A.slice(2, -1)).toEqual(taperVolumes)
      expect(config.tl).toEqual(longRuns)
      expect(config.A.at(-1)).toEqual([0, 30])
    },
  )

  it.each([
    [-2, 1],
    [8, 4],
  ])('limits a requested taper of %i weeks to %i', (requested, expected) => {
    const config = buildCfg(planInput({ tp: requested }))

    expect(config.tp).toBe(expected)
    expect(taperWeeks(config)).toBe(expected)
  })

  it('builds a maintenance plan with constant volume and no test week', () => {
    const config = buildCfg(
      planInput({ type: 'maintain', weeks: 12, cur: 44, peak: 44, cap: 18, q: 0 }),
    )

    expect(config).toMatchObject({
      mode: 'maintain',
      tw: 11,
      T: [12, 0, 0, 0, 0],
      S: 0,
      A: [[11, 44]],
      test: -1,
      recov: -1,
      first: 999,
      mul: false,
    })
    expect(config.roles).toEqual(['rest', 'easy', 'easy', 'easy', 'str', 'easy', 'long'])
    expect(volume(config, 30)).toBe(44)
    expect(volume(config, 0)).toBe(44)
  })

  it('adds a test week only from 24 weeks and with enough build weeks', () => {
    const shortConfig = buildCfg(planInput({ race: '2027-03-29' }))
    const longConfig = buildCfg(planInput({ race: '2027-04-05' }))

    expect(shortConfig.tw).toBe(23)
    expect(shortConfig.test).toBe(-1)
    expect(shortConfig.recov).toBe(-1)
    expect(longConfig.tw).toBe(24)
    expect(longConfig.tw - longConfig.T[3] + 1).toBeGreaterThanOrEqual(8)
    expect(longConfig.test).toBe(longConfig.T[3])
    expect(longConfig.recov).toBe(longConfig.test - 1)
  })

  it.each([
    {
      days: 3,
      rest: [0, 2, 3, 5],
      roles: ['rest', 'q1', 'rest', 'rest', 'q2', 'rest', 'long'],
      strengthDays: [],
    },
    {
      days: 5,
      rest: [0, 4],
      roles: ['rest', 'q1', 'easy', 'q2', 'rest', 'str', 'long'],
      strengthDays: [2, 5],
    },
    {
      days: 6,
      rest: [0],
      roles: ['rest', 'q1', 'easy', 'q2', 'str', 'easy', 'long'],
      strengthDays: [2, 4],
    },
  ])('assigns roles, long run and strength for $days running days', (scenario) => {
    const config = buildCfg(planInput({ rest: scenario.rest, str: 2, lg: 6 }))

    expect(config.roles).toEqual(scenario.roles)
    expect(config.roles[6]).toBe('long')
    expect(config.strD).toEqual(scenario.strengthDays)
  })

  it('is deterministic, independent of the current date and does not mutate its input', () => {
    const input = planInput()
    const original = structuredClone(input)
    Object.freeze(input.rest)
    Object.freeze(input)
    vi.useFakeTimers()

    try {
      vi.setSystemTime(new Date(2020, 0, 1, 12))
      const first = buildCfg(input)
      vi.setSystemTime(new Date(2040, 6, 1, 12))
      const second = buildCfg(input)

      expect(second).toEqual(first)
      expect(input).toEqual(original)
    } finally {
      vi.useRealTimers()
    }
  })

  describe('invalid input compatibility', () => {
    it.each([
      ['an invalid start date', { start: 'invalid' }],
      ['an invalid race date', { race: 'invalid' }],
      ["a race date outside JavaScript's supported range", { race: '275760-09-14' }],
    ])('returns with tw NaN for %s (Taiga #256)', async (_case, overrides) => {
      await expect(buildCfgReturnsNaN(planInput(overrides))).resolves.toBe(true)
    })

    it('keeps the current unvalidated result when the race is before the start (Taiga #253)', () => {
      const config = buildCfg(planInput({ race: '2026-10-18' }))

      expect(config.tw).toBe(-1)
      expect(config.T).toEqual([0, 7, 7, 7, 7])
      expect(config.A).toEqual([
        [4, 50],
        [3, 80],
        [2, 56],
        [1, 40],
        [0, 30],
      ])
    })

    it('keeps one forced long-run day when every weekday is marked as rest (Taiga #254)', () => {
      const config = buildCfg(planInput({ rest: [0, 1, 2, 3, 4, 5, 6], lg: 6 }))

      expect(config.roles).toEqual(['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'long'])
      expect(config.roles.filter((role) => role !== 'rest')).toHaveLength(1)
      expect(config.W).toEqual([0, 0, 0, 0, 0, 0, 0])
      expect(config.strD).toEqual([])
    })

    it('keeps a peak below the current volume as a descending build (Taiga #255)', () => {
      const config = buildCfg(planInput({ cur: 60, peak: 40, cap: 20 }))

      expect(config.A[0]).toEqual([25, 60])
      expect(config.A[1]).toEqual([3, 40])
      expect(config.ls).toBe(0.4)
      expect(volume(config, 25)).toBe(60)
      expect(volume(config, 3)).toBe(40)
    })
  })
})

describe('taperWeeks', () => {
  it('keeps compatibility with legacy and current config versions', () => {
    const config = buildCfg(planInput())

    expect(taperWeeks({ ...config, tp: undefined, tv: undefined })).toBe(4)
    expect(taperWeeks({ ...config, tp: 3, tv: 1 })).toBe(4)
    expect(taperWeeks({ ...config, tp: 3, tv: 2 })).toBe(3)
  })
})

describe('volume', () => {
  const config: Parameters<typeof volume>[0] = {
    A: [
      [10, 20],
      [5, 40],
      [0, 10],
    ],
  }

  it('uses the first support point above the configured range', () => {
    expect(volume(config, 14)).toBe(20)
  })

  it('uses the last support point in race week', () => {
    expect(volume(config, 0)).toBe(10)
  })

  it('interpolates linearly between support points', () => {
    expect(volume(config, 8)).toBe(28)
    expect(volume(config, 3)).toBe(28)
  })
})

describe('phase', () => {
  const config: Parameters<typeof phase>[0] = {
    mode: undefined,
    T: [49, 39, 31, 22, 18],
    tp: 3,
    tv: 2,
  }

  it.each([
    [49, 42.195, 'Regeneration'],
    [39, 42.195, 'Grundlagen'],
    [31, 42.195, 'Tempoentwicklung'],
    [22, 42.195, 'Schwelle & Test'],
    [18, 42.195, 'Entlastung + Basis'],
    [3, 42.195, 'Marathonspezifisch'],
    [3, 21.0975, 'Wettkampfspezifisch'],
    [2, 42.195, 'Tapering'],
  ])('returns %s weeks / %s km as %s', (weeksToRace, raceDistance, expected) => {
    expect(phase(config, weeksToRace, raceDistance)).toBe(expected)
  })

  it('uses the maintenance phase regardless of the remaining weeks', () => {
    expect(phase({ ...config, mode: 'maintain' }, 100, 42.195)).toBe('Erhaltung')
    expect(phase({ ...config, mode: 'maintain' }, 0, 42.195)).toBe('Erhaltung')
  })
})

describe('isDeload', () => {
  it('marks every fourth elapsed maintenance week', () => {
    const config: Parameters<typeof isDeload>[0] = {
      mode: 'maintain' as const,
      tw: 12,
      T: [13, 0, 0, 0, 0],
      test: -1,
      recov: -1,
      tp: undefined,
      tv: undefined,
    }

    expect([12, 11, 10, 9, 8, 7, 6, 5].map((week) => isDeload(config, week))).toEqual([
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
    ])
  })

  it('marks every fourth eligible race-plan week', () => {
    const config: Parameters<typeof isDeload>[0] = {
      mode: undefined,
      tw: 20,
      T: [21, 15, 11, 8, 6],
      test: -1,
      recov: -1,
      tp: 3,
      tv: 2,
    }

    expect([20, 19, 18, 17, 16, 15, 14, 13].map((week) => isDeload(config, week))).toEqual([
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
    ])
    expect(isDeload(config, 5)).toBe(true)
    expect(isDeload(config, 4)).toBe(false)
  })

  it('does not deload test and recovery weeks even when they are on the cadence', () => {
    const config: Parameters<typeof isDeload>[0] = {
      mode: undefined,
      tw: 20,
      T: [21, 15, 11, 8, 6],
      test: 13,
      recov: 9,
      tp: 3,
      tv: 2,
    }

    expect(isDeload(config, 17)).toBe(true)
    expect(isDeload(config, 13)).toBe(false)
    expect(isDeload(config, 9)).toBe(false)
    expect(isDeload(config, 5)).toBe(true)
  })
})
