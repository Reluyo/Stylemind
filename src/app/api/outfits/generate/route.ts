import { NextRequest, NextResponse } from 'next/server'
import { generateOutfits } from '@/lib/ai'
import { WeatherSummary } from '@/lib/types'
import { getAuthedContext, loadWardrobe } from '@/lib/api-auth'
import { rateLimit, sweepExpired } from '@/lib/rate-limit'

const FREE_LIMIT = 3
const PRO_LIMIT = 5

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthedContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    sweepExpired()
    const rl = rateLimit(`generate:${ctx.userId}`, 20, 60_000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })
    }

    // Weather is non-sensitive context from the client; wardrobe + prefs come from the DB.
    const { weather }: { weather: WeatherSummary } = await req.json()
    if (!weather) return NextResponse.json({ error: 'Weather context required' }, { status: 400 })

    const items = await loadWardrobe(ctx.supabase, ctx.userId)
    if (!items.length) return NextResponse.json({ error: 'No wardrobe items provided' }, { status: 400 })

    const outfits = await generateOutfits(items, weather, ctx.stylePreferences)
    const cap = ctx.plan === 'pro' ? PRO_LIMIT : FREE_LIMIT
    return NextResponse.json({ outfits: outfits.slice(0, cap) })
  } catch (err) {
    if (err instanceof Error && err.message === 'AI_MALFORMED') {
      return NextResponse.json({ error: 'AI response malformed, please retry' }, { status: 502 })
    }
    console.error('Generate outfits error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Failed to generate outfits' }, { status: 500 })
  }
}
