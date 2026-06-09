import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserAndProfile } from '@/lib/auth-server'

const VALID_CATEGORIES = ['tops', 'bottoms', 'dresses', 'shoes', 'accessories', 'outerwear']

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI analysis unavailable' }, { status: 503 })
  }

  // Require a session so this AI endpoint can't be hit anonymously.
  const { user } = await getUserAndProfile()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType ?? 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this clothing item photo and respond ONLY with valid JSON (no markdown):
{"name":"descriptive item name","category":"one of: tops/bottoms/dresses/shoes/accessories/outerwear","color":"main color(s)","brand":"brand if visible or null","tags":["2-4 style tags like casual/formal/summer etc"]}`,
            },
          ],
        },
      ],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

    // Sanitize category
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = 'tops'

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
