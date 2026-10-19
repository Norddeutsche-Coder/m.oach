import { readFileSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Parallel agent sessions each run in their own worktree with their own port
// (see .agents/skills/parallel-taiga-session). Elsewhere the port stays 4173.
function sessionPort(): number {
  try {
    const session = JSON.parse(
      readFileSync(new URL('../.moach-session.json', import.meta.url), 'utf8'),
    )
    return Number(session.ports.e2e) || 4173
  } catch {
    return 4173
  }
}
const port = sessionPort()

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
    },
  },
})
