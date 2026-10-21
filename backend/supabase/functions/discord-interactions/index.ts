// Supabase Edge Function entry point for Discord interactions (TG-216).
import { handleInteraction } from './handler.ts'

Deno.serve((req) =>
  handleInteraction(req, {
    publicKey: Deno.env.get('DISCORD_PUBLIC_KEY') ?? '',
    botToken: Deno.env.get('DISCORD_BOT_TOKEN') ?? '',
    fetch,
  })
)
