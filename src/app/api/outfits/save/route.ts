import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { AIOutfitSuggestion, ClothingItem } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { outfit, items }: { outfit: AIOutfitSuggestion; items: ClothingItem[] } = await req.json()
    const supabase = createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Insert outfit record
    const { data: savedOutfit, error: outfitError } = await supabase
      .from('outfits')
      .insert({
        user_id: user.id,
        name: outfit.name,
        occasion: outfit.occasion,
        tags: [outfit.style_tag, outfit.occasion].filter(Boolean),
        ai_generated: true,
        ai_prompt: outfit.reason,
      })
      .select('id')
      .single()

    if (outfitError || !savedOutfit) {
      console.error('Save outfit error:', outfitError)
      return NextResponse.json({ error: 'Failed to save outfit' }, { status: 500 })
    }

    // Match outfit item names to actual clothing_item IDs (case-insensitive)
    const matchedIds: string[] = []
    for (const itemName of outfit.items) {
      const match = items.find(
        (ci) => ci.name.toLowerCase() === itemName.toLowerCase() ||
          ci.name.toLowerCase().includes(itemName.toLowerCase()) ||
          itemName.toLowerCase().includes(ci.name.toLowerCase())
      )
      if (match) matchedIds.push(match.id)
    }

    // Insert outfit_items junction records
    if (matchedIds.length > 0) {
      await supabase.from('outfit_items').insert(
        matchedIds.map((clothing_item_id) => ({
          outfit_id: savedOutfit.id,
          clothing_item_id,
        }))
      )
    }

    return NextResponse.json({ id: savedOutfit.id })
  } catch (err) {
    console.error('Save outfit error:', err)
    return NextResponse.json({ error: 'Failed to save outfit' }, { status: 500 })
  }
}
