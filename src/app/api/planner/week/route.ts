import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai'
import { getAuthedContext, loadWardrobe } from '@/lib/api-auth'
import { rateLimit, sweepExpired } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthedContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Week planner is a Pro feature.
    if (ctx.plan !== 'pro') {
      return NextResponse.json({ error: 'Premium required', code: 'NOT_PRO' }, { status: 403 })
    }

    sweepExpired()
    const rl = rateLimit(`week:${ctx.userId}`, 10, 60_000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })
    }

    const { weekContext }: { weekContext: string } = await req.json()
    const items = await loadWardrobe(ctx.supabase, ctx.userId)
    if (!items.length) return NextResponse.json({ error: 'No wardrobe items' }, { status: 400 })

    const plan = await generateWeekPlan(items, weekContext ?? '')
    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Week plan error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Failed to generate week plan' }, { status: 500 })
  }
}
