// Unit tests for the Discord interactions handler (TG-216).
// Run: npx --yes deno@2 test --no-prompt backend/supabase/functions/discord-interactions/
// No network: Discord is replaced by a fetch mock, keys are generated per run.
import assert from 'node:assert/strict'
import {
  type Deps,
  DISCORD_API,
  GUILD_ID,
  handleInteraction,
  JOIN_BUTTON_ID,
  TESTER_ROLE_ID,
  TEXT_ALREADY,
  TEXT_FAILED,
  TEXT_JOINED,
  verifySignature,
} from './handler.ts'

const encoder = new TextEncoder()

const USER_ID = '777000000000000123'
const BOT_TOKEN = 'bot-token-for-tests-only'
const INTERACTION_TOKEN = 'interaction-token-for-tests-only'
const OTHER_ROLE_ID = '1561389858453460001'
const OTHER_GUILD_ID = '1561383271823399999'

// --- helpers -------------------------------------------------------------------

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

interface TestKeys {
  privateKey: CryptoKey
  publicKeyHex: string
}

async function makeKeys(): Promise<TestKeys> {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey)
  return { privateKey: pair.privateKey, publicKeyHex: toHex(raw) }
}

async function sign(privateKey: CryptoKey, timestamp: string, body: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    encoder.encode(timestamp + body),
  )
  return toHex(signature)
}

const keys = await makeKeys()
const otherKeys = await makeKeys()

// Current time, in case the handler also rejects stale timestamps.
function now(): string {
  return String(Math.floor(Date.now() / 1000))
}

function rawRequest(body: string | null, headers: Record<string, string>, method = 'POST') {
  return new Request('https://example.supabase.co/functions/v1/discord-interactions', {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  })
}

async function signedRequest(
  body: string,
  privateKey: CryptoKey = keys.privateKey,
  timestamp: string = now(),
): Promise<Request> {
  return rawRequest(body, {
    'X-Signature-Ed25519': await sign(privateKey, timestamp, body),
    'X-Signature-Timestamp': timestamp,
  })
}

interface FetchCall {
  url: string
  method: string
  headers: Headers
  signal: AbortSignal | null | undefined
}

function mockFetch(respond: () => Response | Promise<Response>) {
  const calls: FetchCall[] = []
  const fn = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (input instanceof Request) {
      calls.push({
        url: input.url,
        method: (init?.method ?? input.method).toUpperCase(),
        headers: new Headers(init?.headers ?? input.headers),
        signal: init?.signal ?? input.signal,
      })
    } else {
      calls.push({
        url: String(input),
        method: (init?.method ?? 'GET').toUpperCase(),
        headers: new Headers(init?.headers),
        signal: init?.signal,
      })
    }
    return Promise.resolve().then(respond)
  }) as typeof fetch
  return { fn, calls }
}

function noFetch() {
  return mockFetch(() => {
    throw new Error('fetch must not be called')
  })
}

function deps(fetchFn: typeof fetch, overrides: Partial<Deps> = {}): Deps {
  return { publicKey: keys.publicKeyHex, botToken: BOT_TOKEN, fetch: fetchFn, ...overrides }
}

interface ClickOptions {
  type?: number
  guildId?: string | null
  customId?: string
  roles?: string[]
}

// Realistic MESSAGE_COMPONENT interaction for a button click in the guild.
function interaction(options: ClickOptions = {}): string {
  const payload: Record<string, unknown> = {
    id: '1561400000000000001',
    application_id: '1561400000000000002',
    type: options.type ?? 3,
    token: INTERACTION_TOKEN,
    version: 1,
    channel_id: '1561383271823315300',
    member: {
      user: { id: USER_ID, username: 'laeuferin_lena' },
      roles: options.roles ?? [OTHER_ROLE_ID],
    },
    message: { id: '1561383271823315999' },
    data: { custom_id: options.customId ?? JOIN_BUTTON_ID, component_type: 2 },
  }
  if (options.guildId !== null) payload.guild_id = options.guildId ?? GUILD_ID
  return JSON.stringify(payload)
}

async function readJson(res: Response): Promise<unknown> {
  assert.match(res.headers.get('Content-Type') ?? '', /application\/json/)
  return await res.json()
}

function ephemeral(content: string) {
  return { type: 4, data: { content, flags: 64 } }
}

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const

async function captureConsole<T>(fn: () => Promise<T>): Promise<{ result: T; output: string[] }> {
  const originals = CONSOLE_METHODS.map((m) => console[m])
  const output: string[] = []
  for (const m of CONSOLE_METHODS) {
    console[m] = (...args: unknown[]) => {
      output.push(args.map((a) => (typeof a === 'string' ? a : Deno.inspect(a))).join(' '))
    }
  }
  try {
    return { result: await fn(), output }
  } finally {
    CONSOLE_METHODS.forEach((m, i) => {
      console[m] = originals[i]
    })
  }
}

// --- constants -----------------------------------------------------------------

Deno.test('constants match the M.oach Discord server', () => {
  assert.equal(DISCORD_API, 'https://discord.com/api/v10')
  assert.equal(GUILD_ID, '1561383271823315024')
  assert.equal(TESTER_ROLE_ID, '1561389858453463132')
  assert.equal(JOIN_BUTTON_ID, 'moach_tester_join')
})

Deno.test('reply texts', () => {
  assert.ok(TEXT_JOINED.startsWith('Du bist freigeschaltet'), TEXT_JOINED)
  assert.ok(TEXT_ALREADY.startsWith('Du bist schon freigeschaltet'), TEXT_ALREADY)
  assert.ok(TEXT_FAILED.trim().length > 0)
  assert.ok(!TEXT_FAILED.startsWith('Du bist freigeschaltet'), TEXT_FAILED)
  assert.ok(!TEXT_FAILED.startsWith('Du bist schon freigeschaltet'), TEXT_FAILED)
  for (const text of [TEXT_JOINED, TEXT_ALREADY, TEXT_FAILED]) {
    assert.ok(!/direktnachricht/i.test(text), text)
    assert.ok(text.length <= 2000)
  }
})

// --- verifySignature -----------------------------------------------------------

Deno.test('verifySignature accepts a valid signature', async () => {
  const ts = now()
  const body = interaction()
  const sig = await sign(keys.privateKey, ts, body)
  assert.equal(await verifySignature(keys.publicKeyHex, sig, ts, body), true)
})

Deno.test('verifySignature rejects a tampered signature', async () => {
  const ts = now()
  const body = interaction()
  const sig = await sign(keys.privateKey, ts, body)
  const flipped = (sig[0] === '0' ? '1' : '0') + sig.slice(1)
  assert.equal(await verifySignature(keys.publicKeyHex, flipped, ts, body), false)
})

Deno.test('verifySignature rejects a different body', async () => {
  const ts = now()
  const sig = await sign(keys.privateKey, ts, interaction())
  const other = interaction({ roles: [TESTER_ROLE_ID] })
  assert.equal(await verifySignature(keys.publicKeyHex, sig, ts, other), false)
})

Deno.test('verifySignature rejects a different timestamp', async () => {
  const ts = now()
  const body = interaction()
  const sig = await sign(keys.privateKey, ts, body)
  assert.equal(await verifySignature(keys.publicKeyHex, sig, String(Number(ts) + 1), body), false)
})

Deno.test('verifySignature rejects a signature from another key', async () => {
  const ts = now()
  const body = interaction()
  const sig = await sign(otherKeys.privateKey, ts, body)
  assert.equal(await verifySignature(keys.publicKeyHex, sig, ts, body), false)
})

Deno.test('verifySignature returns false for broken public keys without throwing', async () => {
  const ts = now()
  const body = interaction()
  const sig = await sign(keys.privateKey, ts, body)
  for (const publicKey of ['', 'xyz', 'zz'.repeat(32), '00', keys.publicKeyHex.slice(1)]) {
    assert.equal(await verifySignature(publicKey, sig, ts, body), false, `key ${publicKey}`)
  }
})

Deno.test('verifySignature returns false for broken signatures without throwing', async () => {
  const ts = now()
  const body = interaction()
  const sig = await sign(keys.privateKey, ts, body)
  for (const signature of ['', 'ab', sig.slice(0, 64), 'zz'.repeat(64), sig.slice(1), sig + '00']) {
    assert.equal(
      await verifySignature(keys.publicKeyHex, signature, ts, body),
      false,
      `sig ${signature}`,
    )
  }
})

// --- handleInteraction: rejection ----------------------------------------------

Deno.test('non-POST requests get 405 without fetch', async () => {
  const fetchMock = noFetch()
  for (const method of ['GET', 'PUT']) {
    const body = method === 'GET' ? null : interaction()
    const res = await handleInteraction(rawRequest(body, {}, method), deps(fetchMock.fn))
    assert.equal(res.status, 405, method)
    await res.body?.cancel()
  }
  assert.equal(fetchMock.calls.length, 0)
})

Deno.test('missing signature headers get 401 without fetch', async () => {
  const fetchMock = noFetch()
  const body = interaction()
  const ts = now()
  const sig = await sign(keys.privateKey, ts, body)
  const variants: Record<string, string>[] = [
    {},
    { 'X-Signature-Timestamp': ts },
    { 'X-Signature-Ed25519': sig },
  ]
  for (const headers of variants) {
    const res = await handleInteraction(rawRequest(body, headers), deps(fetchMock.fn))
    assert.equal(res.status, 401, JSON.stringify(Object.keys(headers)))
    await res.body?.cancel()
  }
  assert.equal(fetchMock.calls.length, 0)
})

Deno.test('invalid signature gets 401 and grants no role', async () => {
  const fetchMock = noFetch()
  const res = await handleInteraction(
    await signedRequest(interaction(), otherKeys.privateKey),
    deps(fetchMock.fn),
  )
  assert.equal(res.status, 401)
  await res.body?.cancel()
  assert.equal(fetchMock.calls.length, 0)
})

Deno.test('garbage signature header gets 401 without throwing', async () => {
  const fetchMock = noFetch()
  const req = rawRequest(interaction(), {
    'X-Signature-Ed25519': 'not-hex',
    'X-Signature-Timestamp': now(),
  })
  const res = await handleInteraction(req, deps(fetchMock.fn))
  assert.equal(res.status, 401)
  await res.body?.cancel()
  assert.equal(fetchMock.calls.length, 0)
})

Deno.test('empty public key gets 401 even for a signed request', async () => {
  const fetchMock = noFetch()
  const res = await handleInteraction(
    await signedRequest(interaction()),
    deps(fetchMock.fn, { publicKey: '' }),
  )
  assert.equal(res.status, 401)
  await res.body?.cancel()
  assert.equal(fetchMock.calls.length, 0)
})

Deno.test('signed body that is not JSON gets 400', async () => {
  const fetchMock = noFetch()
  const res = await handleInteraction(await signedRequest('not json {'), deps(fetchMock.fn))
  assert.equal(res.status, 400)
  await res.body?.cancel()
  assert.equal(fetchMock.calls.length, 0)
})

// --- handleInteraction: PING ---------------------------------------------------

Deno.test('PING is answered with PONG', async () => {
  const fetchMock = noFetch()
  const body = JSON.stringify({ id: '1561400000000000001', type: 1, version: 1 })
  const res = await handleInteraction(await signedRequest(body), deps(fetchMock.fn))
  assert.equal(res.status, 200)
  assert.deepEqual(await readJson(res), { type: 1 })
  assert.equal(fetchMock.calls.length, 0)
})

// --- handleInteraction: button click -------------------------------------------

Deno.test('first click grants the tester role and answers ephemerally', async () => {
  const fetchMock = mockFetch(() => new Response(null, { status: 204 }))
  const res = await handleInteraction(await signedRequest(interaction()), deps(fetchMock.fn))

  assert.equal(fetchMock.calls.length, 1)
  const call = fetchMock.calls[0]
  assert.equal(
    call.url,
    `${DISCORD_API}/guilds/${GUILD_ID}/members/${USER_ID}/roles/${TESTER_ROLE_ID}`,
  )
  assert.equal(call.method, 'PUT')
  assert.equal(call.headers.get('Authorization'), `Bot ${BOT_TOKEN}`)
  assert.ok(call.signal instanceof AbortSignal, 'fetch needs a timeout signal')
  assert.equal(call.signal.aborted, false)

  assert.equal(res.status, 200)
  assert.deepEqual(await readJson(res), ephemeral(TEXT_JOINED))
})

Deno.test('first click also works when Discord answers 200', async () => {
  const fetchMock = mockFetch(() => new Response(null, { status: 200 }))
  const res = await handleInteraction(await signedRequest(interaction()), deps(fetchMock.fn))
  assert.equal(fetchMock.calls.length, 1)
  assert.deepEqual(await readJson(res), ephemeral(TEXT_JOINED))
})

Deno.test('second click answers "already" and changes nothing', async () => {
  const fetchMock = noFetch()
  const body = interaction({ roles: [OTHER_ROLE_ID, TESTER_ROLE_ID] })
  const res = await handleInteraction(await signedRequest(body), deps(fetchMock.fn))
  assert.equal(res.status, 200)
  assert.deepEqual(await readJson(res), ephemeral(TEXT_ALREADY))
  assert.equal(fetchMock.calls.length, 0)
})

Deno.test('first click with no roles at all grants the role', async () => {
  const fetchMock = mockFetch(() => new Response(null, { status: 204 }))
  const res = await handleInteraction(
    await signedRequest(interaction({ roles: [] })),
    deps(fetchMock.fn),
  )
  assert.equal(fetchMock.calls.length, 1)
  assert.deepEqual(await readJson(res), ephemeral(TEXT_JOINED))
})

Deno.test('Discord errors answer TEXT_FAILED ephemerally with status 200', async () => {
  for (const status of [403, 404, 429, 500]) {
    const fetchMock = mockFetch(() => new Response('{"message":"nope"}', { status }))
    const res = await handleInteraction(await signedRequest(interaction()), deps(fetchMock.fn))
    assert.equal(fetchMock.calls.length, 1, String(status))
    assert.equal(res.status, 200, String(status))
    assert.deepEqual(await readJson(res), ephemeral(TEXT_FAILED), String(status))
  }
})

Deno.test('fetch throwing (network or timeout) answers TEXT_FAILED', async () => {
  const errors = [new TypeError('network down'), new DOMException('timed out', 'TimeoutError')]
  for (const error of errors) {
    const fetchMock = mockFetch(() => {
      throw error
    })
    const res = await handleInteraction(await signedRequest(interaction()), deps(fetchMock.fn))
    assert.equal(fetchMock.calls.length, 1)
    assert.equal(res.status, 200)
    assert.deepEqual(await readJson(res), ephemeral(TEXT_FAILED))
  }
})

Deno.test('other custom_id, guild or interaction type get 400 without fetch', async () => {
  const fetchMock = noFetch()
  const bodies = {
    otherCustomId: interaction({ customId: 'something_else' }),
    otherGuild: interaction({ guildId: OTHER_GUILD_ID }),
    noGuild: interaction({ guildId: null }),
    slashCommand: interaction({ type: 2 }),
    modalSubmit: interaction({ type: 5 }),
  }
  for (const [name, body] of Object.entries(bodies)) {
    const res = await handleInteraction(await signedRequest(body), deps(fetchMock.fn))
    assert.equal(res.status, 400, name)
    await res.body?.cancel()
  }
  assert.equal(fetchMock.calls.length, 0)
})

// --- privacy -------------------------------------------------------------------

Deno.test('no console output with user ID, bot token or body', async () => {
  const scenarios: Array<[string, () => Promise<Response>]> = [
    ['joined', async () => {
      const f = mockFetch(() => new Response(null, { status: 204 }))
      return await handleInteraction(await signedRequest(interaction()), deps(f.fn))
    }],
    ['already', async () => {
      const body = interaction({ roles: [TESTER_ROLE_ID] })
      return await handleInteraction(await signedRequest(body), deps(noFetch().fn))
    }],
    ['discord 403', async () => {
      const f = mockFetch(() => new Response(`{"message":"${USER_ID}"}`, { status: 403 }))
      return await handleInteraction(await signedRequest(interaction()), deps(f.fn))
    }],
    ['fetch throws', async () => {
      const f = mockFetch(() => {
        throw new TypeError(`connect failed for ${USER_ID}`)
      })
      return await handleInteraction(await signedRequest(interaction()), deps(f.fn))
    }],
    ['bad signature', async () => {
      const req = await signedRequest(interaction(), otherKeys.privateKey)
      return await handleInteraction(req, deps(noFetch().fn))
    }],
  ]
  const body = interaction()
  for (const [name, run] of scenarios) {
    const { result, output } = await captureConsole(run)
    await result.body?.cancel()
    for (const line of output) {
      assert.ok(!line.includes(USER_ID), `${name}: log contains user ID`)
      assert.ok(!line.includes(BOT_TOKEN), `${name}: log contains bot token`)
      assert.ok(!line.includes(INTERACTION_TOKEN), `${name}: log contains interaction token`)
      assert.ok(!line.includes(body), `${name}: log contains body`)
    }
  }
})
