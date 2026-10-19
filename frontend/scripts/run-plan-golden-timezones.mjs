import { spawnSync } from 'node:child_process'

const timeZones = ['UTC', 'Pacific/Auckland']
const vitestArgs = [
  'node_modules/vitest/vitest.mjs',
  'run',
  'src/features/plan/legacy-plan-golden.test.ts',
  '--reporter=dot',
]

for (const timeZone of timeZones) {
  console.log(`Running plan golden master with TZ=${timeZone}`)
  const result = spawnSync(process.execPath, vitestArgs, {
    env: { ...process.env, CI: 'true', TZ: timeZone },
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
