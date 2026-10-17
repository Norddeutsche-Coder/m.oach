// Starts the Vite dev server with test values and opens the app in a visible browser with fixed
// test data, so a person can look at a UI change before it is committed and pushed.
// Plain Node without shell commands, so it runs the same on macOS, Linux and Windows.
// Usage: node preview.cjs <frontend-dir> <szenarien.json>
//
// szenarien.json uses the same format as qa-taiga-ticket/scripts/shots.cjs:
// [{ "name", "date", "localStorage", "tab", "click", "viewport": "phone" | "desktop", "dark" }]
// The server gets the first free port from 4183 to 4189, apart from the usual dev port so the
// test data does not mix with local data. Every scenario opens in its own window. When all
// windows are closed, the server is stopped and the script exits. A scenario whose page, tab or
// click target cannot be reached is reported as FEHLER and makes the exit code 1; its window
// stays open so the problem can be seen. External requests are blocked.
const { spawn } = require('child_process')
const fs = require('fs')
const net = require('net')
const path = require('path')

const [, , frontendArg, scenarioFile] = process.argv
if (!scenarioFile) {
  console.error('Aufruf: node preview.cjs <frontend-ordner> <szenarien.json>')
  process.exit(2)
}
const frontend = path.resolve(frontendArg)
const { chromium } = require(path.join(frontend, 'node_modules', '@playwright', 'test'))
const scenarios = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'))
const sizes = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 860 } }
const host = '127.0.0.1'

const isFree = port => new Promise(resolve => {
  const server = net.createServer().once('error', () => resolve(false))
  server.listen(port, host, () => server.close(() => resolve(true)))
})

async function waitForServer(url, server) {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) return false
    try { if ((await fetch(url)).ok) return true } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

;(async () => {
  let port
  for (let p = 4183; p <= 4189 && !port; p++) if (await isFree(p)) port = p
  if (!port) { console.error('FEHLER: kein freier Port zwischen 4183 und 4189'); process.exit(1) }

  const server = spawn(process.execPath, [path.join(frontend, 'node_modules', 'vite', 'bin', 'vite.js'),
    '--host', host, '--port', String(port), '--strictPort'], {
    cwd: frontend,
    env: { ...process.env,
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only_000000000000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let serverLog = ''
  server.stdout.on('data', d => { serverLog += d })
  server.stderr.on('data', d => { serverLog += d })
  const stopServer = () => { if (server.exitCode === null) server.kill() }
  process.on('exit', stopServer)
  process.on('SIGINT', () => process.exit(130))
  process.on('SIGTERM', () => process.exit(143))

  const baseUrl = `http://${host}:${port}/`
  if (!(await waitForServer(baseUrl, server))) {
    console.error(`FEHLER: Dev-Server antwortet nicht\n${serverLog.slice(-2000)}`)
    process.exit(1)
  }
  console.log(`server: ${baseUrl}`)

  const browser = await chromium.launch({ headless: false })
  let open = 0
  let failed = 0
  const finish = async () => { await browser.close(); process.exit(failed ? 1 : 0) }
  for (const s of scenarios) {
    const context = await browser.newContext({
      viewport: sizes[s.viewport || 'phone'], colorScheme: s.dark ? 'dark' : 'light',
    })
    await context.route('**/*', r => new URL(r.request().url()).hostname === host ? r.continue() : r.abort())
    const page = await context.newPage()
    page.on('pageerror', e => console.log(`   ! ${s.name}: ${String(e).slice(0, 200)}`))
    page.on('console', m => { if (m.type() === 'error') console.log(`   ! ${s.name}: ${m.text().slice(0, 200)}`) })
    if (s.date) await page.clock.setFixedTime(new Date(s.date))
    await page.addInitScript(entries => {
      if (sessionStorage.getItem('preview-seeded')) return
      sessionStorage.setItem('preview-seeded', '1')
      for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v)
    }, s.localStorage || {})
    try {
      await page.goto(baseUrl, { timeout: 15000 })
      await page.waitForTimeout(700)
      if (s.tab) await page.locator(`nav button:has-text("${s.tab}")`).first().click({ timeout: 5000 })
      if (s.click) { await page.waitForTimeout(500); await page.locator(s.click).first().click({ timeout: 5000 }) }
      console.log(`offen: ${s.name}`)
    } catch (e) {
      failed++
      console.log(`FEHLER ${s.name}: ${String(e).split('\n')[0].slice(0, 300)}`)
    }
    open++
    page.on('close', async () => {
      await context.close()
      if (--open === 0) await finish()
    })
  }
  console.log(`alle Fenster geöffnet: ${scenarios.length - failed} ok, ${failed} FEHLER`)
  if (open === 0) await finish()
})()
