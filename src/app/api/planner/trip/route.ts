import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildWardrobeSummary } from '@/lib/ai'
import type { ClothingItem } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
  }
  try {
    const { items, days, occasion, destination }: {
      items: ClothingItem[]
      days: number
      occasion: string
      destination?: string
    } = await req.json()

    if (!items?.length) return NextResponse.json({ error: 'No wardrobe items' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: `You are StyleMind, a personal AI stylist. Create a ${days}-day trip outfit plan.
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
        content: `Wardrobe:\n${buildWardrobeSummary(items)}\n\nTrip: ${days} days${destination ? `, destination: ${destination}` : ''}. Occasion: ${occasion || 'mixed casual and smart casual'}.\n\nCreate the ${days}-day plan.`,
      }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Trip planner error:', err)
    return NextResponse.json({ error: 'Failed to generate trip plan' }, { status: 500 })
  }
}
