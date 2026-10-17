// Starts the app with test values and opens it in a visible browser with fixed test data, so a
// person can look at a UI change before it is committed and pushed. With --vorher the old state
// is opened next to it, so the difference can be seen.
// Plain Node without shell commands, so it runs the same on macOS, Linux and Windows.
// Usage: node preview.cjs <frontend-dir> <szenarien.json> [--vorher <git-ref>]
//
// szenarien.json uses the same format as qa-taiga-ticket/scripts/shots.cjs:
// [{ "name", "date", "localStorage", "tab", "click", "viewport": "phone" | "desktop", "dark" }]
// "Nachher" is the working tree of <frontend-dir> on a Vite dev server, so edits show up at once.
// "Vorher" is <git-ref> checked out as a git worktree next to szenarien.json, built once and
// served with vite preview. Ports are the first free ones from 4183 to 4189, apart from the usual
// dev port so the test data does not mix with local data. Every scenario opens in its own window,
// with --vorher once per state, labelled VORHER and NACHHER. When all windows are closed, servers
// and worktree are removed and the script exits. A scenario whose page, tab or click target cannot
// be reached is reported as FEHLER and makes the exit code 1; its window stays open so the problem
// can be seen. External requests and service workers are blocked.
const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const net = require('net')
const path = require('path')

const args = process.argv.slice(2)
const vorherIndex = args.indexOf('--vorher')
const vorherRef = vorherIndex >= 0 ? args.splice(vorherIndex, 2)[1] : null
const [frontendArg, scenarioFile] = args
if (!scenarioFile || (vorherIndex >= 0 && !vorherRef)) {
  console.error('Aufruf: node preview.cjs <frontend-ordner> <szenarien.json> [--vorher <git-ref>]')
  process.exit(2)
}
const frontend = path.resolve(frontendArg)
const { chromium } = require(path.join(frontend, 'node_modules', '@playwright', 'test'))
const scenarios = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'))
const sizes = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 860 } }
const host = '127.0.0.1'
const testEnv = {
  ...process.env,
  VITE_SUPABASE_URL: 'https://test-project.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only_000000000000',
}
const workDir = path.dirname(path.resolve(scenarioFile))
const basisDir = path.join(workDir, 'basis-src')
const repoRoot = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: frontend, encoding: 'utf8' }).stdout.trim()

const basisFrontend = path.join(basisDir, path.relative(repoRoot, frontend))
const basisModules = path.join(basisFrontend, 'node_modules')
const basisDist = path.join(workDir, 'basis-dist')

// The node_modules link is removed first, so deleting the worktree never reaches the real one.
function removeWorktree() {
  try { if (fs.lstatSync(basisModules).isSymbolicLink()) fs.unlinkSync(basisModules) } catch {}
  if (fs.existsSync(basisDir)) spawnSync('git', ['worktree', 'remove', '--force', basisDir], { cwd: repoRoot })
  spawnSync('git', ['worktree', 'prune'], { cwd: repoRoot })
}

const servers = []
let worktreeAdded = false
function cleanup() {
  for (const s of servers) if (s.exitCode === null) s.kill()
  if (worktreeAdded) { removeWorktree(); fs.rmSync(basisDist, { recursive: true, force: true }) }
  worktreeAdded = false
}
process.on('exit', cleanup)
process.on('SIGINT', () => process.exit(130))
process.on('SIGTERM', () => process.exit(143))
const fail = message => { console.error(`FEHLER: ${message}`); process.exit(1) }

const isFree = port => new Promise(resolve => {
  const server = net.createServer().once('error', () => resolve(false))
  server.listen(port, host, () => server.close(() => resolve(true)))
})
async function freePort(taken) {
  for (let p = 4183; p <= 4189; p++) if (!taken.includes(p) && (await isFree(p))) return p
  fail('kein freier Port zwischen 4183 und 4189')
}

function viteArgs(dir, ...rest) {
  return [path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js'), ...rest]
}

async function startServer(label, cwd, nodeArgs) {
  const server = spawn(process.execPath, nodeArgs, { cwd, env: testEnv, stdio: ['ignore', 'pipe', 'pipe'] })
  servers.push(server)
  let log = ''
  server.stdout.on('data', d => { log += d })
  server.stderr.on('data', d => { log += d })
  const port = nodeArgs[nodeArgs.indexOf('--port') + 1]
  const url = `http://${host}:${port}/`
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) break
    try { if ((await fetch(url)).ok) return url } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  fail(`${label}-Server antwortet nicht\n${log.slice(-2000)}`)
}

// Checks out the old state and builds it once; node_modules is shared when the lockfile matches.
function prepareVorher() {
  removeWorktree()
  const add = spawnSync('git', ['worktree', 'add', '--detach', basisDir, vorherRef], { cwd: repoRoot, encoding: 'utf8' })
  if (add.status !== 0) fail(`Worktree für ${vorherRef} nicht angelegt\n${add.stderr}`)
  worktreeAdded = true
  const lock = dir => fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8')
  if (lock(basisFrontend) === lock(frontend)) {
    // A junction needs no admin rights on Windows and is a plain symlink elsewhere.
    fs.symlinkSync(path.join(frontend, 'node_modules'), basisModules, 'junction')
  } else {
    const ci = spawnSync('npm', ['ci', '--silent'], { cwd: basisFrontend, shell: process.platform === 'win32', encoding: 'utf8' })
    if (ci.status !== 0) fail(`npm ci für ${vorherRef} fehlgeschlagen\n${ci.stderr.slice(-2000)}`)
  }
  const outDir = basisDist
  const build = spawnSync(process.execPath, viteArgs(basisFrontend, 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'),
    { cwd: basisFrontend, env: testEnv, encoding: 'utf8' })
  if (build.status !== 0) fail(`Build von ${vorherRef} fehlgeschlagen\n${(build.stdout + build.stderr).slice(-2000)}`)
  return outDir
}

;(async () => {
  const ports = []
  ports.push(await freePort(ports))
  const nachherUrl = await startServer('Nachher', frontend,
    viteArgs(frontend, '--host', host, '--port', String(ports[0]), '--strictPort'))
  console.log(`nachher: ${nachherUrl}`)

  const states = [{ label: 'NACHHER', url: nachherUrl, column: vorherRef ? 1 : 0 }]
  if (vorherRef) {
    const outDir = prepareVorher()
    ports.push(await freePort(ports))
    const vorherUrl = await startServer('Vorher', basisFrontend,
      viteArgs(basisFrontend, 'preview', '--outDir', outDir, '--host', host, '--port', String(ports[1]), '--strictPort'))
    console.log(`vorher (${vorherRef}): ${vorherUrl}`)
    states.unshift({ label: 'VORHER', url: vorherUrl, column: 0 })
  }

  const browser = await chromium.launch({ headless: false })
  let open = 0
  let failed = 0
  const finish = async () => { await browser.close(); process.exit(failed ? 1 : 0) }
  for (const [index, s] of scenarios.entries()) {
    for (const state of states) {
      const name = vorherRef ? `${s.name} · ${state.label.toLowerCase()}` : s.name
      const viewport = sizes[s.viewport || 'phone']
      const context = await browser.newContext({
        viewport, colorScheme: s.dark ? 'dark' : 'light', serviceWorkers: 'block',
      })
      await context.route('**/*', r => new URL(r.request().url()).hostname === host ? r.continue() : r.abort())
      const page = await context.newPage()
      page.on('pageerror', e => console.log(`   ! ${name}: ${String(e).slice(0, 200)}`))
      page.on('console', m => { if (m.type() === 'error') console.log(`   ! ${name}: ${m.text().slice(0, 200)}`) })
      if (s.date) await page.clock.setFixedTime(new Date(s.date))
      await page.addInitScript(entries => {
        if (sessionStorage.getItem('preview-seeded')) return
        sessionStorage.setItem('preview-seeded', '1')
        for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v)
      }, s.localStorage || {})
      if (vorherRef) {
        await page.addInitScript(label => {
          document.title = label
          addEventListener('DOMContentLoaded', () => {
            const badge = document.createElement('div')
            badge.textContent = label
            badge.style.cssText = 'position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
              'padding:2px 8px;border-radius:6px;font:600 11px system-ui,sans-serif;pointer-events:none;' +
              `color:#fff;background:${label === 'VORHER' ? '#6b7280' : '#2563eb'};opacity:.9`
            document.body.appendChild(badge)
          })
        }, state.label)
      }
      // Old state on the left, new state on the right, further scenarios slightly offset.
      try {
        const cdp = await context.newCDPSession(page)
        const { windowId } = await cdp.send('Browser.getWindowForTarget')
        await cdp.send('Browser.setWindowBounds', {
          windowId, bounds: { left: state.column * (viewport.width + 40) + index * 30, top: index * 30 },
        })
      } catch {}
      try {
        await page.goto(state.url, { timeout: 15000 })
        await page.waitForTimeout(700)
        if (s.tab) await page.locator(`nav button:has-text("${s.tab}")`).first().click({ timeout: 5000 })
        if (s.click) { await page.waitForTimeout(500); await page.locator(s.click).first().click({ timeout: 5000 }) }
        console.log(`offen: ${name}`)
      } catch (e) {
        failed++
        console.log(`FEHLER ${name}: ${String(e).split('\n')[0].slice(0, 300)}`)
      }
      open++
      page.on('close', async () => {
        await context.close()
        if (--open === 0) await finish()
      })
    }
  }
  const total = scenarios.length * states.length
  console.log(`alle Fenster geöffnet: ${total - failed} ok, ${failed} FEHLER`)
  if (open === 0) await finish()
})()
