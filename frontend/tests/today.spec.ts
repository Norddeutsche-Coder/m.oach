import { test, expect, type Page } from '@playwright/test'
import { todayScenarios } from './fixtures/today'
const fixedDate = '2026-10-16'
async function seed(page: Page, overrides: Record<string, unknown> = {}, date = fixedDate) {
  await page.clock.setFixedTime(new Date(`${date}T10:00:00+02:00`))
  await page.addInitScript(({ state }) => {
    if (localStorage.getItem('today-test-seeded')) return
    localStorage.setItem('today-test-seeded', '1')
    localStorage.setItem('moach_sb', JSON.stringify({
      url: 'https://test-project.supabase.co',
      key: 'sb_publishable_test_only_000000000000',
    }))
    localStorage.setItem('moach_users', JSON.stringify([{ id: 'test', name: 'Testläufer' }, { id: 'coach', name: 'Coach Test' }]))
    localStorage.setItem('moach_cur', 'test')
    localStorage.setItem('mplan2_test', JSON.stringify(state))
  }, { state: { start: '2026-10-12', race: '2027-09-26', goal: 9900, base: 11400, prof: { name: 'Testläufer' }, ...overrides } })
}

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  page.on('pageerror', error => { throw error })
})

for (const scenario of todayScenarios) {
  test(`today preserves original content: ${scenario.name}`, async ({ page }) => {
    await seed(page, scenario.state, scenario.date)
    await page.goto('/')
    await expect(page.locator('#today .ht')).toHaveText(scenario.expected.title)
    await expect(page.locator('#today .hs')).toHaveText(scenario.expected.subtitle)
    await expect(page.locator('#today .ring')).toHaveAttribute('aria-label', scenario.expected.readiness)
    const actual = await page.locator('#today').evaluate(element => {
      const normalize = (s: string | null) => (s || '').replace(/\s+/g, ' ').trim()
      return {
        training: [...element.querySelectorAll('.sr')].map(row => normalize(row.textContent)),
        stats: [...element.querySelectorAll('.st')].map(row => normalize(row.textContent)),
      }
    })
    expect(actual.training).toEqual(scenario.expected.training)
    expect(actual.stats).toEqual(scenario.expected.stats)
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}

test('race day with low readiness keeps the race and gives pacing advice instead of moving it', async ({ page }) => {
  await seed(page, { race: fixedDate, start: '2026-01-01', well: { [fixedDate]: { sleep: 4, rd: 40, ctl: 30, atl: 75 } } })
  await page.goto('/')
  await expect(page.locator('#today .ring')).toHaveAttribute('aria-label', 'Training Readiness 25 von 100')
  await expect(page.locator('#today .ht')).toHaveText('MARATHON')
  await expect(page.locator('#today .hn')).toContainText('Erste Kilometer bewusst kontrolliert laufen.')
  await expect(page.locator('#today')).not.toContainText(/verschieben/i)
})

test('factors persist, info opens, profile changes update the greeting', async ({ page }) => {
  await seed(page)
  await page.goto('/')
  await page.locator('#fxh').click()
  await expect(page.locator('#fxb')).toBeVisible()
  await page.reload()
  await expect(page.locator('#fxh')).toHaveAttribute('aria-expanded', 'true')
  await page.locator('#today .pill').getByRole('button', { name: 'Info' }).click()
  await expect(page.locator('#im')).toBeVisible()
  await page.locator('#imx').click()
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
  await page.locator('#pn').fill('<img src=x onerror=alert(1)>')
  await page.locator('#ss').click()
  await page.getByRole('navigation').getByRole('button', { name: 'Heute', exact: true }).click()
  await expect(page.locator('#today .gr')).toContainText('<img src=x onerror=alert(1)>')
  await expect(page.locator('#today .gr img')).toHaveCount(0)
})

test('completed run opens details and local coaching requests can be declined', async ({ page }) => {
  await seed(page, { log: { [fixedDate]: { done: true, km: 5, min: 30, rpe: '3' } } })
  await page.addInitScript(() => {
    if (!localStorage.getItem('coach-test-seeded')) {
      localStorage.setItem('coach-test-seeded', '1')
      localStorage.setItem('moach_coach_req', JSON.stringify([{ from: 'coach', to: 'test', st: 'p' }]))
    }
  })
  await page.goto('/')
  await expect(page.locator('#today .hdone')).toContainText('5 km in 30 min · Ø 6:00 /km')
  await page.getByRole('button', { name: 'Lauf öffnen: Manueller Eintrag', exact: true }).click()
  await expect(page.locator('#rv')).toBeVisible()
  await page.locator('#rvx').click()
  await page.locator('#today .inbox').getByRole('button', { name: 'Ablehnen', exact: true }).click()
  await expect(page.locator('#today .inbox')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('#today .inbox')).toHaveCount(0)
})
