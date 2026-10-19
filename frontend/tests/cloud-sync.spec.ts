import { expect, test, type Page, type Route } from '@playwright/test'

const supabaseOrigin = 'https://test-project.supabase.co'
const userId = 'cloud-sync-test'
const runDate = '2026-10-18'

type State = Record<string, unknown>
type CloudRow = { state: State; modified: number; updated_at: string }

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function seedCloudSession(page: Page, state: State) {
  await page.addInitScript(
    ({ seededState, seededUserId }) => {
      localStorage.setItem(
        'moach_sb',
        JSON.stringify({
          url: 'https://test-project.supabase.co',
          key: 'sb_publishable_test_only_000000000000',
        }),
      )
      localStorage.setItem(
        'moach_users',
        JSON.stringify([{ id: seededUserId, name: 'Lokaler Name' }]),
      )
      localStorage.setItem('moach_cur', seededUserId)
      localStorage.setItem(`mplan2_${seededUserId}`, JSON.stringify(seededState))
      localStorage.setItem(
        `moach_sbs_${seededUserId}`,
        JSON.stringify({
          at: 'public-test-access',
          rt: 'public-test-refresh',
          exp: 4_102_444_800_000,
          uid: seededUserId,
          email: 'cloud-sync@example.invalid',
        }),
      )
    },
    { seededState: state, seededUserId: userId },
  )
}

async function mockCloud(page: Page, userData: (method: string) => CloudRow) {
  await page.route(`${supabaseOrigin}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path === '/rest/v1/user_data' && request.method() === 'GET') {
      return json(route, [userData('GET')])
    }
    if (path === '/rest/v1/user_data' && request.method() === 'PATCH') {
      return json(route, [])
    }
    if (path === '/rest/v1/user_data' && request.method() === 'POST') {
      return json(route, { message: 'duplicate test row' }, 409)
    }
    if (path === '/rest/v1/profiles' && url.searchParams.has('order')) {
      return json(route, [{ id: userId, name: 'Lokaler Name' }])
    }
    if (path === '/rest/v1/profiles') {
      return json(route, [{ id: userId, name: 'Lokaler Name' }])
    }
    if (path === '/rest/v1/rpc/is_admin') return json(route, false)
    if (path === '/rest/v1/coach_requests') return json(route, [])
    if (path === '/rest/v1/push_subscriptions') return json(route, [])

    return json(route, [])
  })
}

async function expectConflictChoice(page: Page) {
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
  await expect(page.locator('#clld')).toHaveText('Cloud-Stand laden')
  await expect(page.locator('#clup')).toHaveText('Diesen Stand hochladen')
  const card = page.locator('#clld').locator('xpath=ancestor::*[contains(@class, "card")]')
  await expect(card).toContainText(/(?:beiden|zwei) Geräten/i)
  await expect(card).toContainText(/nicht gewählte(?:n)? (?:Fassung|Stand).*verworfen/i)
}

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (route) => {
    const hostname = new URL(route.request().url()).hostname
    return hostname === '127.0.0.1' || hostname === 'test-project.supabase.co'
      ? route.continue()
      : route.abort()
  })
  page.on('pageerror', (error) => {
    throw error
  })
})

test('app start keeps a local RPE and note when the cloud state differs', async ({ page }) => {
  const localState = {
    _m: 100,
    start: '2026-10-12',
    race: '2027-09-26',
    goal: 9900,
    base: 11400,
    prof: { name: 'Lokaler Name' },
    log: { [runDate]: { done: true, km: '8', min: '48', rpe: '8', note: 'Lokale Notiz' } },
  }
  const cloudState = {
    ...localState,
    _m: 200,
    prof: { name: 'Cloud-Name' },
    log: {},
  }
  const cloudRow = {
    state: cloudState,
    modified: 200,
    updated_at: '2026-10-19T08:00:00.000Z',
  }

  await seedCloudSession(page, localState)
  await mockCloud(page, () => cloudRow)
  await page.goto('/')

  await expectConflictChoice(page)
  await expect
    .poll(() =>
      page.evaluate((id) => JSON.parse(localStorage.getItem(`mplan2_${id}`) || 'null'), userId),
    )
    .toEqual(localState)
})

test('a rejected conditional push offers both states without losing local changes', async ({
  page,
}) => {
  const initialState = {
    _m: 100,
    start: '2026-10-12',
    race: '2027-09-26',
    goal: 9900,
    base: 11400,
    prof: { name: 'Lokaler Name' },
    log: { [runDate]: { done: true, km: '8', min: '48', rpe: '8', note: 'Lokale Notiz' } },
  }
  const parallelCloudState = {
    ...initialState,
    _m: 101,
    prof: { name: 'Parallel in der Cloud geändert' },
  }
  let cloudReads = 0

  await seedCloudSession(page, initialState)
  await mockCloud(page, () => {
    cloudReads += 1
    return cloudReads === 1
      ? {
          state: { ...initialState, _m: 999 },
          modified: 100,
          updated_at: '2026-10-19T08:00:00.000Z',
        }
      : {
          state: parallelCloudState,
          modified: 101,
          updated_at: '2026-10-19T08:01:00.000Z',
        }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
  await expect(page.locator('#clnow')).toBeVisible()
  await page.locator('#pn').fill('Lokal geändert')
  await page.locator('#ss').click()
  await page.locator('#clnow').click()

  await expectConflictChoice(page)
  const stored = await page.evaluate(
    (id) => JSON.parse(localStorage.getItem(`mplan2_${id}`) || 'null'),
    userId,
  )
  expect(stored.prof.name).toBe('Lokal geändert')
  expect(stored.log[runDate]).toEqual(initialState.log[runDate])
})
