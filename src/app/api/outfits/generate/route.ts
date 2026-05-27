import { NextRequest, NextResponse } from 'next/server'
import { generateOutfits } from '@/lib/ai'
import { ClothingItem, WeatherSummary } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { items, weather }: { items: ClothingItem[]; weather: WeatherSummary } = await req.json()
    if (!items?.length) return NextResponse.json({ error: 'No wardrobe items provided' }, { status: 400 })
    const outfits = await generateOutfits(items, weather)
    return NextResponse.json({ outfits })
  } catch (err) {
    console.error('Generate outfits error:', err)
    return NextResponse.json({ error: 'Failed to generate outfits' }, { status: 500 })
  }
}
