import { test, expect, type Page } from '@playwright/test'

const fixedDate = '2026-10-16'

async function seed(page: Page) {
  await page.clock.setFixedTime(new Date(`${fixedDate}T10:00:00+02:00`))
  await page.addInitScript(
    ({ state }) => {
      if (localStorage.getItem('wizard-test-seeded')) return
      localStorage.setItem('wizard-test-seeded', '1')
      localStorage.setItem(
        'moach_sb',
        JSON.stringify({
          url: 'https://test-project.supabase.co',
          key: 'sb_publishable_test_only_000000000000',
        }),
      )
      localStorage.setItem('moach_users', JSON.stringify([{ id: 'test', name: 'Testläufer' }]))
      localStorage.setItem('moach_cur', 'test')
      localStorage.setItem('mplan2_test', JSON.stringify(state))
    },
    {
      state: {
        start: '2026-10-12',
        race: '2027-09-26',
        goal: 9900,
        base: 11400,
        prof: { name: 'Testläufer' },
      },
    },
  )
}

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort(),
  )
  page.on('pageerror', (error) => {
    throw error
  })
})

test('a longest run above half the peak volume is only a hint and the plan is created', async ({
  page,
}) => {
  await seed(page)
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Hauptmenü' })
    .getByRole('button', { name: 'Kalender', exact: true })
    .click()
  await page.locator('#wzgo').click()
  const wizard = page.locator('#wz')
  const next = wizard.locator('#wn')
  await next.click()
  await next.click()
  await expect(wizard).toContainText('Schritt 3 von 5')

  await wizard.locator('#wc').fill('50')
  await wizard.locator('#wp').fill('55')
  await wizard.locator('#wl').fill('31')
  await next.click()
  const hint = wizard.locator('#wzh')
  await expect(hint).toBeVisible()
  await expect(hint).toHaveText(
    'Hinweis: Dein längster Lauf ist mehr als die Hälfte deines Höchstumfangs. Im Plan wird er in den umfangreichsten Wochen etwa 22 km lang, weil ein Lauf höchstens 40 % des Wochenumfangs ausmacht.',
  )
  await expect(wizard.locator('#wze')).toBeHidden()
  await expect(wizard).toContainText('Schritt 3 von 5')

  await next.click()
  await expect(wizard).toContainText('Schritt 4 von 5')
  await next.click()
  await expect(wizard).toContainText('Schritt 5 von 5')

  // The preview covers the whole plan: the longest run matches the hint, no day has negative km.
  const preview = await wizard.innerText()
  expect(preview).toMatch(/22 km\s+längster Lauf/)
  const runs = [...preview.matchAll(/·\s*(-?\d+) km/g)].map((m) => Number(m[1]))
  expect(runs.length).toBeGreaterThan(0)
  expect(Math.min(...runs)).toBeGreaterThanOrEqual(0)
  expect(Math.max(...runs)).toBeLessThanOrEqual(31)

  await wizard.getByRole('button', { name: 'Plan übernehmen' }).click()
  await expect(wizard).toBeHidden()
  await expect(page.locator('body')).not.toContainText(/-\d+ km/)
})

test('no hint while the longest run is at most half the peak volume', async ({ page }) => {
  await seed(page)
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Hauptmenü' })
    .getByRole('button', { name: 'Kalender', exact: true })
    .click()
  await page.locator('#wzgo').click()
  const wizard = page.locator('#wz')
  const next = wizard.locator('#wn')
  await next.click()
  await next.click()
  await wizard.locator('#wc').fill('50')
  await wizard.locator('#wp').fill('55')
  await wizard.locator('#wl').fill('27')
  await next.click()
  await expect(wizard).toContainText('Schritt 4 von 5')
  await expect(wizard.locator('#wzh')).toBeHidden()
})

test('other volume checks still block the next step', async ({ page }) => {
  await seed(page)
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Hauptmenü' })
    .getByRole('button', { name: 'Kalender', exact: true })
    .click()
  await page.locator('#wzgo').click()
  const wizard = page.locator('#wz')
  const next = wizard.locator('#wn')
  await next.click()
  await next.click()
  await wizard.locator('#wl').fill('50')
  await next.click()
  await expect(wizard.locator('#wze')).toHaveText(
    'Der längste Lauf sollte zwischen 8 und 45 km liegen.',
  )
  await expect(wizard).toContainText('Schritt 3 von 5')
})

test('changing the numbers after the hint shows it again', async ({ page }) => {
  await seed(page)
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Hauptmenü' })
    .getByRole('button', { name: 'Kalender', exact: true })
    .click()
  await page.locator('#wzgo').click()
  const wizard = page.locator('#wz')
  const next = wizard.locator('#wn')
  await next.click()
  await next.click()
  await wizard.locator('#wc').fill('50')
  await wizard.locator('#wp').fill('55')
  await wizard.locator('#wl').fill('31')
  await next.click()
  await expect(wizard.locator('#wzh')).toContainText('etwa 22 km')
  await wizard.locator('#wp').fill('70')
  await wizard.locator('#wl').fill('40')
  await next.click()
  await expect(wizard.locator('#wzh')).toContainText('etwa 28 km')
  await expect(wizard).toContainText('Schritt 3 von 5')
})

async function openWizard(page: Page) {
  await seed(page)
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Hauptmenü' })
    .getByRole('button', { name: 'Kalender', exact: true })
    .click()
  await page.locator('#wzgo').click()
  return page.locator('#wz')
}

async function toVolumeStep(wizard: ReturnType<Page['locator']>) {
  await wizard.locator('#wn').click()
  await wizard.locator('#wn').click()
  await expect(wizard).toContainText('Schritt 3 von 5')
}

const longestRun = async (wizard: ReturnType<Page['locator']>) =>
  Number((await wizard.innerText()).match(/(\d+) km\s+längster Lauf/)![1])

test('a 5 km plan below 30 km/week names the quarter rule and matches the preview', async ({
  page,
}) => {
  const wizard = await openWizard(page)
  await wizard.locator('[data-ty="5"]').click()
  await toVolumeStep(wizard)
  await wizard.locator('#wc').fill('20')
  await wizard.locator('#wp').fill('25')
  await wizard.locator('#wl').fill('16')
  await wizard.locator('#wn').click()
  await expect(wizard.locator('#wzh')).toContainText(
    'etwa 6 km lang, weil der längste Lauf bei weniger als 30 km pro Woche ein Viertel des Wochenumfangs ist.',
  )
  await wizard.locator('#wn').click()
  await wizard.locator('#wn').click()
  await expect(wizard).toContainText('Schritt 5 von 5')
  expect(await longestRun(wizard)).toBe(6)
})

test('taper long runs stay within the peak week limit', async ({ page }) => {
  const wizard = await openWizard(page)
  await wizard.locator('[data-ty="42.195"]').click()
  await wizard.locator('[data-tp="4"]').click()
  await toVolumeStep(wizard)
  await wizard.locator('#wc').fill('40')
  await wizard.locator('#wp').fill('45')
  await wizard.locator('#wl').fill('45')
  await wizard.locator('#wn').click()
  await expect(wizard.locator('#wzh')).toContainText('etwa 18 km lang')
  await wizard.locator('#wn').click()
  await wizard.locator('#wn').click()
  await expect(wizard).toContainText('Schritt 5 von 5')
  expect(await longestRun(wizard)).toBeLessThanOrEqual(18)
})

for (const taper of ['2', '4'])
  test(`half marathon below 30 km/week with taper ${taper} keeps the hinted long run`, async ({
    page,
  }) => {
    const wizard = await openWizard(page)
    await wizard.locator('[data-ty="21.0975"]').click()
    await wizard.locator(`[data-tp="${taper}"]`).click()
    await toVolumeStep(wizard)
    await wizard.locator('#wc').fill('20')
    await wizard.locator('#wp').fill('25')
    await wizard.locator('#wl').fill('16')
    await wizard.locator('#wn').click()
    await expect(wizard.locator('#wzh')).toContainText('etwa 6 km lang')
    await wizard.locator('#wn').click()
    await wizard.locator('#wn').click()
    await expect(wizard).toContainText('Schritt 5 von 5')
    expect(await longestRun(wizard)).toBeLessThanOrEqual(6)
  })

test('"Ausdauer erhalten" talks about the weekly volume', async ({ page }) => {
  const wizard = await openWizard(page)
  await wizard.locator('[data-ty="m"]').click()
  await toVolumeStep(wizard)
  await expect(wizard.locator('#wp')).toHaveCount(0)
  await wizard.locator('#wc').fill('40')
  await wizard.locator('#wl').fill('25')
  await wizard.locator('#wn').click()
  await expect(wizard.locator('#wzh')).toHaveText(
    'Hinweis: Dein längster Lauf ist mehr als die Hälfte deines Wochenumfangs. Im Plan wird er etwa 16 km lang, weil ein Lauf höchstens 40 % des Wochenumfangs ausmacht.',
  )
})

test('an invalid value after the hint shows only the error, the hint returns once corrected', async ({
  page,
}) => {
  const wizard = await openWizard(page)
  await toVolumeStep(wizard)
  await wizard.locator('#wc').fill('50')
  await wizard.locator('#wp').fill('55')
  await wizard.locator('#wl').fill('31')
  await wizard.locator('#wn').click()
  await expect(wizard.locator('#wzh')).toBeVisible()
  await wizard.locator('#wl').fill('50')
  await wizard.locator('#wn').click()
  await expect(wizard.locator('#wze')).toBeVisible()
  await expect(wizard.locator('#wzh')).toBeHidden()
  await wizard.locator('#wl').fill('31')
  await wizard.locator('#wn').click()
  await expect(wizard.locator('#wze')).toBeHidden()
  await expect(wizard.locator('#wzh')).toBeVisible()
  await expect(wizard).toContainText('Schritt 3 von 5')
})
