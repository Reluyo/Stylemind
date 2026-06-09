import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai'
import { getUserAndProfile } from '@/lib/auth-server'
import { ClothingItem } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await getUserAndProfile()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Week planner is a Pro feature.
    if (profile?.plan !== 'pro') {
      return NextResponse.json({ error: 'Week planner is a Pro feature.', code: 'NOT_PRO' }, { status: 403 })
    }

    const { items, weekContext }: { items: ClothingItem[]; weekContext: string } = await req.json()
    const plan = await generateWeekPlan(items, weekContext)
    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Week plan error:', err)
    return NextResponse.json({ error: 'Failed to generate week plan' }, { status: 500 })
  }
}
