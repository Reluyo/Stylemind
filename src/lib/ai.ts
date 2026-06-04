import Anthropic from '@anthropic-ai/sdk'
import { ClothingItem, AIOutfitSuggestion, WeatherSummary } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export function buildWardrobeSummary(items: ClothingItem[]): string {
  if (!items.length) return 'The user has no clothing items yet.'
  const grouped: Record<string, string[]> = {}
  items.forEach((c) => {
    if (!grouped[c.category]) grouped[c.category] = []
    grouped[c.category].push(`${c.name}${c.color ? ` (${c.color})` : ''}`)
  })
  return Object.entries(grouped)
    .map(([cat, its]) => `${cat}: ${its.join(', ')}`)
    .join('\n')
}

export function buildWeatherContext(weather: WeatherSummary): string {
  const now = new Date()
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `${dayName}, ${dateStr}. ${weather.location}. ${weather.temp_f}°F, ${weather.condition}. Season: ${weather.season}. Work day.`
}

// Generate 5 outfit suggestions
export async function generateOutfits(
  items: ClothingItem[],
  weather: WeatherSummary,
  stylePreferences: string[] = []
): Promise<AIOutfitSuggestion[]> {
  const styleNote = stylePreferences.length
    ? `\n- The user's style preferences are: ${stylePreferences.join(', ')}. Lean into these aesthetics.`
    : ''

  const systemPrompt = `You are StyleMind, a personal AI stylist. Given a user's wardrobe and the day's weather/context, suggest exactly 5 outfit combinations.

Respond ONLY with valid JSON — no markdown, no extra text. Format:
{"outfits":[{"name":"string","occasion":"string","items":["item name 1","item name 2","item name 3"],"style_tag":"string","reason":"string (1 short sentence why this works today)"}]}

Rules:
- Only use items that actually exist in the wardrobe list provided.
- Each outfit should have 2–4 items.
- Vary the occasions (e.g. work, casual, smart casual, evening, sporty).
- Keep reasons concise and weather/day relevant.${styleNote}`

  const userMsg = `Wardrobe:\n${buildWardrobeSummary(items)}\n\nContext: ${buildWeatherContext(weather)}\n\nSuggest 5 outfits.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMsg }],
  })

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  return parsed.outfits as AIOutfitSuggestion[]
}

// Stream a stylist chat response
export async function streamStyleChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  wardrobeSummary: string,
  weatherContext: string
) {
  const systemPrompt = `You are StyleMind, a warm and knowledgeable personal AI stylist. Help the user refine their outfit choices.

When asked to change/adjust an outfit:
1. Be specific — name actual items from their wardrobe
2. Keep advice concise (2–4 sentences)
3. Explain why the change works for today's weather/occasion
4. Be encouraging and personal

Wardrobe available:\n${wardrobeSummary}\n\nToday's context: ${weatherContext}`

  return anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: systemPrompt,
    messages,
  })
}

// Generate full week plan
export async function generateWeekPlan(
  items: ClothingItem[],
  weekContext: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    system: `You are StyleMind, a personal AI stylist. Plan a full work week of outfits (Mon–Fri) for the user. Be specific, reference actual items from their wardrobe, and explain each choice briefly. Format as Mon/Tue/Wed/Thu/Fri with outfit name and 1-line reason. Keep it friendly and practical.`,
    messages: [
      {
        role: 'user',
        content: `Wardrobe:\n${buildWardrobeSummary(items)}\n\nWeek context: ${weekContext}\n\nPlan my outfit week.`,
      },
    ],
  })

  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
}
