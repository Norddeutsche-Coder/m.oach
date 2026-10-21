// Discord interactions endpoint (TG-216): a click on "Ich will testen" in #willkommen grants the
// tester role. Requests are authenticated only by Discord's Ed25519 signature. Nothing is stored
// and nothing is logged, so user IDs and tokens never leave this request.

export const DISCORD_API = 'https://discord.com/api/v10'
export const GUILD_ID = '1561383271823315024'
export const TESTER_ROLE_ID = '1561389858453463132'
// Must match TESTER_JOIN_ID in scripts/moach_taiga.py.
export const JOIN_BUTTON_ID = 'moach_tester_join'

export const TEXT_JOINED =
  'Du bist freigeschaltet 🎉 Ab jetzt siehst du den Bereich Testläufer mit <#1561389878837776394>, <#1561389880590995639> und <#1561389882381705217>. Viel Spaß beim Testen!'
export const TEXT_ALREADY =
  'Du bist schon freigeschaltet. Den Bereich Testläufer findest du in der Kanalliste.'
export const TEXT_FAILED =
  'Das hat gerade nicht geklappt. Bitte versuch es in ein paar Minuten noch einmal.'

const INTERACTION_PING = 1
const INTERACTION_MESSAGE_COMPONENT = 3
const RESPONSE_PONG = 1
const RESPONSE_CHANNEL_MESSAGE = 4
const FLAG_EPHEMERAL = 64
const DISCORD_TIMEOUT_MS = 2500
const AUDIT_LOG_REASON = 'Self-unlock via welcome button'

export interface Deps {
  publicKey: string
  botToken: string
  fetch: typeof fetch
}

const encoder = new TextEncoder()

function hexToBytes(hex: string, length: number): Uint8Array<ArrayBuffer> | null {
  if (hex.length !== length * 2 || !/^[0-9a-f]*$/i.test(hex)) return null
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

export async function verifySignature(
  publicKeyHex: string,
  signatureHex: string,
  timestamp: string,
  body: string,
): Promise<boolean> {
  const publicKey = hexToBytes(publicKeyHex, 32)
  const signature = hexToBytes(signatureHex, 64)
  if (!publicKey || !signature) return false
  try {
    const key = await crypto.subtle.importKey('raw', publicKey, 'Ed25519', false, ['verify'])
    return await crypto.subtle.verify('Ed25519', key, signature, encoder.encode(timestamp + body))
  } catch {
    return false
  }
}

function json(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function ephemeral(content: string): Response {
  return json({ type: RESPONSE_CHANNEL_MESSAGE, data: { content, flags: FLAG_EPHEMERAL } })
}

function empty(status: number): Response {
  return new Response(null, { status })
}

interface Interaction {
  type?: unknown
  guild_id?: unknown
  data?: { custom_id?: unknown }
  member?: { user?: { id?: unknown }; roles?: unknown }
}

async function grantTesterRole(userId: string, deps: Deps): Promise<boolean> {
  try {
    const res = await deps.fetch(
      `${DISCORD_API}/guilds/${GUILD_ID}/members/${userId}/roles/${TESTER_ROLE_ID}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${deps.botToken}`,
          'X-Audit-Log-Reason': encodeURIComponent(AUDIT_LOG_REASON),
        },
        signal: AbortSignal.timeout(DISCORD_TIMEOUT_MS),
      },
    )
    await res.body?.cancel()
    return res.ok
  } catch {
    return false
  }
}

export async function handleInteraction(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== 'POST') return empty(405)

  const signature = req.headers.get('X-Signature-Ed25519')
  const timestamp = req.headers.get('X-Signature-Timestamp')
  const body = await req.text()
  const verified = !!signature && !!timestamp && !!deps.publicKey &&
    (await verifySignature(deps.publicKey, signature, timestamp, body))
  if (!verified) return empty(401)

  let interaction: Interaction
  try {
    interaction = JSON.parse(body)
  } catch {
    return empty(400)
  }
  if (!interaction || typeof interaction !== 'object') return empty(400)

  if (interaction.type === INTERACTION_PING) return json({ type: RESPONSE_PONG })

  const userId = interaction.member?.user?.id
  if (
    interaction.type !== INTERACTION_MESSAGE_COMPONENT ||
    interaction.data?.custom_id !== JOIN_BUTTON_ID ||
    interaction.guild_id !== GUILD_ID ||
    typeof userId !== 'string' || !/^\d+$/.test(userId)
  ) {
    return empty(400)
  }

  const roles = interaction.member?.roles
  if (Array.isArray(roles) && roles.includes(TESTER_ROLE_ID)) return ephemeral(TEXT_ALREADY)

  return ephemeral((await grantTesterRole(userId, deps)) ? TEXT_JOINED : TEXT_FAILED)
}
