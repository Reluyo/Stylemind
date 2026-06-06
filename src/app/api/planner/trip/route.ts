import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildWardrobeSummary } from '@/lib/ai'
import { getAuthedContext, loadWardrobe } from '@/lib/api-auth'
import { rateLimit, sweepExpired } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
  }
  try {
    const ctx = await getAuthedContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Trip planner is a Pro feature.
    if (ctx.plan !== 'pro') {
      return NextResponse.json({ error: 'Premium required', code: 'NOT_PRO' }, { status: 403 })
    }

    sweepExpired()
    const rl = rateLimit(`trip:${ctx.userId}`, 10, 60_000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })
    }

    const { days, occasion, destination }: {
      days: number
      occasion: string
      destination?: string
    } = await req.json()

    const safeDays = Math.max(1, Math.min(14, Math.floor(Number(days) || 0)))
    if (!safeDays) return NextResponse.json({ error: 'Invalid number of days' }, { status: 400 })

    const items = await loadWardrobe(ctx.supabase, ctx.userId)
    if (!items.length) return NextResponse.json({ error: 'No wardrobe items' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: `You are StyleMind, a personal AI stylist. Create a ${safeDays}-day trip outfit plan.
Respond ONLY with valid JSON — no markdown:
{"plan":[{"day":1,"outfit_name":"string","occasion":"string","items":["exact item name 1","exact item name 2"],"notes":"one packing or styling tip"}]}
Rules:
- ONLY use item names that exist verbatim in the provided wardrobe list
- Each outfit: 2–4 items
- Vary outfits — avoid repeating the same combination
- Consider weather/occasion for the destination
- Notes should be brief (one sentence max)`,
      messages: [{
        role: 'user',
        content: `Wardrobe:\n${buildWardrobeSummary(items)}\n\nTrip: ${safeDays} days${destination ? `, destination: ${destination}` : ''}. Occasion: ${occasion || 'mixed casual and smart casual'}.\n\nCreate the ${safeDays}-day plan.`,
      }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    let parsed
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      console.error('Trip planner: AI returned non-JSON')
      return NextResponse.json({ error: 'AI response malformed, please retry' }, { status: 502 })
    }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Trip planner error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Failed to generate trip plan' }, { status: 500 })
  }
}
