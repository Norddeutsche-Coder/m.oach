import { test, expect, type Page } from '@playwright/test'

const fixedDate = '2026-10-16'
const runId = 'i9001'

// Simulated GPS loop of about 5 km around 53.1°/8.2°, in the Intervals.icu streams format.
function streams() {
  const n = 200,
    lat: number[] = [],
    lon: number[] = [],
    distance: number[] = [],
    time: number[] = []
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / (n - 1)
    lat.push(53.1 + 0.0072 * Math.sin(a))
    lon.push(8.2 + 0.012 * (1 - Math.cos(a)))
    distance.push((5000 * i) / (n - 1))
    time.push((1800 * i) / (n - 1))
  }
  return [
    { type: 'time', data: time },
    { type: 'distance', data: distance },
    { type: 'latlng', data: lat, data2: lon },
  ]
}

async function seedRun(page: Page) {
  await page.clock.setFixedTime(new Date(`${fixedDate}T10:00:00+02:00`))
  await page.addInitScript(
    ({ state }) => {
      if (localStorage.getItem('map-test-seeded')) return
      localStorage.setItem('map-test-seeded', '1')
      localStorage.setItem(
        'moach_sb',
        JSON.stringify({
          url: 'https://test-project.supabase.co',
          key: 'sb_publishable_test_only_000000000000',
        }),
      )
      localStorage.setItem('moach_users', JSON.stringify([{ id: 'test', name: 'Testläufer' }]))
      localStorage.setItem('moach_cur', 'test')
      localStorage.setItem('mplan_icu_test', JSON.stringify({ id: 'i0', key: 'e2e-placeholder' }))
      localStorage.setItem('mplan2_test', JSON.stringify(state))
    },
    {
      state: {
        start: '2026-10-12',
        race: '2027-09-26',
        goal: 9900,
        base: 11400,
        prof: { name: 'Testläufer' },
        runs: [{ id: runId, d: fixedDate, t: '07:30', n: 'Morgenlauf', km: 5, sec: 1800 }],
      },
    },
  )
}

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') return route.continue()
    if (
      url.hostname === 'intervals.icu' &&
      url.pathname === `/api/v1/activity/${runId}/streams.json`
    )
      return route.fulfill({ json: streams() })
    if (url.hostname === 'intervals.icu' && url.pathname === `/api/v1/activity/${runId}`)
      return route.fulfill({ json: {} })
    return route.abort()
  })
  page.on('pageerror', (error) => {
    throw error
  })
})

test('run detail shows the route and the zoom controls change the view', async ({ page }) => {
  await seedRun(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Lauf öffnen: Morgenlauf', exact: true }).click()
  const map = page.locator('#rvm')
  const route = map.locator('.mml')
  await expect(route).toHaveAttribute('d', /^M[\d. L-]+$/)
  const fitted = await route.getAttribute('d')

  await map.getByRole('button', { name: 'Vergrößern' }).click()
  await expect(route).not.toHaveAttribute('d', fitted!)

  await map.getByRole('button', { name: 'Route zentrieren' }).click()
  await expect(route).toHaveAttribute('d', fitted!)

  const sources = map.getByRole('button', { name: 'Kartenquellen anzeigen' })
  await sources.click()
  await expect(map.getByRole('button', { name: 'Kartenquellen ausblenden' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})

test('heatmap keeps a zoomed view when switching to another tab and back', async ({ page }) => {
  await seedRun(page)
  await page.goto('/')
  const heatmap = page.locator('#hmm')
  const lines = heatmap.locator('.mmh.h0')
  await expect(lines).toHaveAttribute('d', /^M[\d. L-]+$/)
  const fitted = await lines.getAttribute('d')

  await heatmap.getByRole('button', { name: 'Vergrößern' }).click()
  await expect(lines).not.toHaveAttribute('d', fitted!)
  const zoomed = await lines.getAttribute('d')

  const nav = page.getByRole('navigation', { name: 'Hauptmenü' })
  await nav.getByRole('button', { name: 'Kalender', exact: true }).click()
  await expect(heatmap).toBeHidden()
  await nav.getByRole('button', { name: 'Heute', exact: true }).click()
  await expect(heatmap).toBeVisible()
  await expect(lines).toHaveAttribute('d', zoomed!)
})

async function openRunMap(page: Page) {
  await seedRun(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Lauf öffnen: Morgenlauf', exact: true }).click()
  const map = page.locator('#rvm')
  await expect(map.locator('.mml')).toHaveAttribute('d', /^M/)
  return map
}

const toMeters = (label: string) => {
  const [value, unit] = label.trim().split(' ')
  return Number(value) * (unit === 'km' ? 1000 : 1)
}

test('maps load topo tiles and name Esri and the OpenStreetMap contributors', async ({ page }) => {
  const map = await openRunMap(page)
  await expect(map.locator('.mmi').first()).toHaveAttribute(
    'src',
    /\/World_Topo_Map\/MapServer\/tile\//,
  )
  const attribution = map.locator('.mma span')
  await expect(attribution).toContainText('Esri')
  await expect(attribution).toContainText('OpenStreetMap-Mitwirkende')
  await expect(page.locator('#hmm .mmi').first()).toHaveAttribute('src', /World_Topo_Map/)
})

test('zoom and center buttons are stacked at the top left with at least 40 × 40 px', async ({
  page,
}) => {
  const map = await openRunMap(page)
  const mapBox = (await map.boundingBox())!
  const boxes = []
  for (const name of ['Vergrößern', 'Verkleinern', 'Route zentrieren']) {
    const box = (await map.getByRole('button', { name, exact: true }).boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(40)
    expect(box.height).toBeGreaterThanOrEqual(40)
    expect(box.x - mapBox.x).toBeLessThan(20)
    expect(box.y - mapBox.y).toBeLessThan(mapBox.height / 2)
    boxes.push(box)
  }
  expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height)
  expect(boxes[2].y).toBeGreaterThanOrEqual(boxes[1].y + boxes[1].height)
})

test('info and scale sit at the bottom left without overlapping', async ({ page }) => {
  const map = await openRunMap(page)
  const mapBox = (await map.boundingBox())!
  const info = (await map.getByRole('button', { name: 'Kartenquellen anzeigen' }).boundingBox())!
  const scale = (await map.locator('.mmsc').boundingBox())!
  for (const box of [info, scale]) {
    expect(box.x - mapBox.x).toBeLessThan(mapBox.width / 2)
    expect(mapBox.y + mapBox.height - (box.y + box.height)).toBeLessThan(20)
  }
  expect(info.x + info.width).toBeLessThanOrEqual(scale.x)
})

test('the scale shows a round distance of 50 to 125 px that shrinks after zooming in', async ({
  page,
}) => {
  const map = await openRunMap(page)
  const scale = map.locator('.mmsc')
  const before = (await scale.textContent())!
  expect(before).toMatch(/^[125]0* (m|km)$/)
  const width = (await scale.boundingBox())!.width
  expect(width).toBeGreaterThanOrEqual(50)
  expect(width).toBeLessThanOrEqual(125 + 1)

  await map.getByRole('button', { name: 'Vergrößern' }).click()
  await expect(scale).not.toHaveText(before)
  expect(toMeters((await scale.textContent())!)).toBeLessThan(toMeters(before))
})

test('route and heatmap lines have a white casing below the blue line', async ({ page }) => {
  const map = await openRunMap(page)
  const route = map.locator('.mml'),
    casing = map.locator('.mmlc')
  await expect(casing).toHaveAttribute('d', (await route.getAttribute('d'))!)
  const widths = await map.evaluate((el) => {
    const style = (sel: string) => getComputedStyle(el.querySelector(sel)!)
    return {
      route: [style('.mml').stroke, parseFloat(style('.mml').strokeWidth)],
      casing: [style('.mmlc').stroke, parseFloat(style('.mmlc').strokeWidth)],
    }
  })
  expect(widths.route[0]).toBe('rgb(23, 65, 143)')
  expect(widths.casing[0]).toBe('rgb(255, 255, 255)')
  expect((widths.casing[1] as number) - (widths.route[1] as number)).toBeGreaterThanOrEqual(2)

  await page.locator('#rvx').click()
  const heat = page.locator('#hmm')
  await expect(heat.locator('.mmhc.h0')).toHaveAttribute(
    'd',
    (await heat.locator('.mmh.h0').getAttribute('d'))!,
  )
})

test('the attribution opens and closes with the keyboard', async ({ page }) => {
  const map = await openRunMap(page)
  await map.getByRole('button', { name: 'Route zentrieren' }).focus()
  await page.keyboard.press('Tab')
  const info = map.locator('.mma')
  await expect(info).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(info).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Enter')
  await expect(info).toHaveAttribute('aria-expanded', 'false')
})

test.describe('dark mode', () => {
  test.use({ colorScheme: 'dark' })

  test('dims the map to 85 % without inverting it and uses dark controls', async ({ page }) => {
    const map = await openRunMap(page)
    const styles = await map.evaluate((el) => {
      const zoom = getComputedStyle(el.querySelector('.mmz button')!)
      return {
        filter: getComputedStyle(el.querySelector('.mmt')!).filter,
        background: zoom.backgroundColor,
        color: zoom.color,
      }
    })
    expect(styles.filter).toBe('brightness(0.85)')
    const lum = (rgb: string) => {
      const [r, g, b] = rgb.match(/\d+/g)!.map(Number)
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    }
    expect(lum(styles.background)).toBeLessThan(0.25)
    expect(lum(styles.color)).toBeGreaterThan(0.75)
  })
})

test.describe('map style', () => {
  test('switching to satellite in the run detail keeps the view and applies to the heatmap after reload', async ({
    page,
  }) => {
    const map = await openRunMap(page)
    const choice = map.getByRole('combobox', { name: 'Kartenart' })
    await expect(choice).toHaveValue('standard')
    await expect(choice.locator('option:checked')).toHaveText('Standard-Karte')
    const choiceBox = (await choice.boundingBox())!,
      mapBox = (await map.boundingBox())!
    expect(mapBox.x + mapBox.width - (choiceBox.x + choiceBox.width)).toBeLessThan(20)
    expect(choiceBox.y - mapBox.y).toBeLessThan(20)
    const route = await map.locator('.mml').getAttribute('d')

    await choice.selectOption('satellite')
    await expect(map.locator('.mmi').first()).toHaveAttribute(
      'src',
      /\/World_Imagery\/MapServer\/tile\//,
    )
    await expect(map.locator('.mmi[src*="World_Topo_Map"]')).toHaveCount(0)
    await expect(map.locator('.mml')).toHaveAttribute('d', route!)
    await expect(map.locator('.mma span')).toContainText('Maxar')
    await expect(map.locator('.mma span')).not.toContainText('HERE')

    await page.reload()
    const heatChoice = page.locator('#hmm').getByRole('combobox', { name: 'Kartenart' })
    await expect(heatChoice).toHaveValue('satellite')
    await expect(page.locator('#hmm .mmi').first()).toHaveAttribute('src', /World_Imagery/)
  })

  test('the heatmap behind the run detail switches at once', async ({ page }) => {
    const map = await openRunMap(page)
    await map.getByRole('combobox', { name: 'Kartenart' }).selectOption('satellite')
    await page.locator('#rvx').click()
    await expect(page.locator('#hmm').getByRole('combobox', { name: 'Kartenart' })).toHaveValue(
      'satellite',
    )
    await expect(page.locator('#hmm .mmi').first()).toHaveAttribute('src', /World_Imagery/)
  })

  test('the choice works with the keyboard', async ({ page }) => {
    const map = await openRunMap(page)
    const choice = map.getByRole('combobox', { name: 'Kartenart' })
    await choice.focus()
    await expect(choice).toBeFocused()
    await page.keyboard.press('s')
    await expect(choice).toHaveValue('satellite')
  })

  test('an invalid saved value starts with the standard map', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('moach_map_style', 'hybrid'))
    const map = await openRunMap(page)
    await expect(map.getByRole('combobox', { name: 'Kartenart' })).toHaveValue('standard')
    await expect(map.locator('.mmi').first()).toHaveAttribute('src', /World_Topo_Map/)
  })

  test('switching only adds moach_map_style to the stored data', async ({ page }) => {
    const map = await openRunMap(page)
    const snapshot = () =>
      page.evaluate(() =>
        Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])),
      )
    const before = await snapshot()
    await map.getByRole('combobox', { name: 'Kartenart' }).selectOption('satellite')
    const after = await snapshot()
    expect(after.moach_map_style).toBe('satellite')
    delete after.moach_map_style
    delete before.moach_map_style
    expect(after).toEqual(before)
  })
})

test('the heatmap shows no start or finish points, the run detail does', async ({ page }) => {
  const map = await openRunMap(page)
  await expect(map.locator('.mms')).toBeVisible()
  await expect(map.locator('.mme')).toBeVisible()
  await page.locator('#rvx').click()
  await expect(page.locator('#hmm .mmh.h0')).toHaveAttribute('d', /^M/)
  await expect(page.locator('#hmm .mms')).toBeHidden()
  await expect(page.locator('#hmm .mme')).toBeHidden()
})
