import { NextRequest, NextResponse } from 'next/server'
import { streamStyleChat, buildWardrobeSummary, buildWeatherContext } from '@/lib/ai'
import { WeatherSummary } from '@/lib/types'
import { getAuthedContext, loadWardrobe } from '@/lib/api-auth'
import { rateLimit, sweepExpired } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ctx = await getAuthedContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Stylist chat is a Pro feature.
  if (ctx.plan !== 'pro') {
    return NextResponse.json({ error: 'Premium required', code: 'NOT_PRO' }, { status: 403 })
  }

  sweepExpired()
  const rl = rateLimit(`chat:${ctx.userId}`, 30, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })
  }

  const {
    messages,
    weather,
  }: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    weather: WeatherSummary
  } = await req.json()

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  const items = await loadWardrobe(ctx.supabase, ctx.userId)
  const wardrobeSummary = buildWardrobeSummary(items)
  const weatherContext = weather ? buildWeatherContext(weather) : 'No weather context.'

  const stream = await streamStyleChat(messages, wardrobeSummary, weatherContext)

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        console.error('Stylist stream error:', err instanceof Error ? err.message : 'unknown')
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
