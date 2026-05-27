import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai'
import { ClothingItem } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { items, weekContext }: { items: ClothingItem[]; weekContext: string } = await req.json()
    const plan = await generateWeekPlan(items, weekContext)
    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Week plan error:', err)
    return NextResponse.json({ error: 'Failed to generate week plan' }, { status: 500 })
  }
}
