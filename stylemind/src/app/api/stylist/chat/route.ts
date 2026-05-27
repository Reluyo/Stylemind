import { NextRequest } from 'next/server'
import { streamStyleChat, buildWardrobeSummary, buildWeatherContext } from '@/lib/ai'
import { ClothingItem, WeatherSummary } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const {
    messages,
    items,
    weather,
  }: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    items: ClothingItem[]
    weather: WeatherSummary
  } = await req.json()

  const wardrobeSummary = buildWardrobeSummary(items)
  const weatherContext = buildWeatherContext(weather)

  const stream = await streamStyleChat(messages, wardrobeSummary, weatherContext)

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
