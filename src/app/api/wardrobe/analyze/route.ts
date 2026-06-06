import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthedContext } from '@/lib/api-auth'
import { rateLimit, sweepExpired } from '@/lib/rate-limit'

const VALID_CATEGORIES = ['tops', 'bottoms', 'dresses', 'shoes', 'accessories', 'outerwear']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
// Base64 string length cap (~7MB encoded ≈ ~5MB decoded image).
const MAX_BASE64_LEN = 7_000_000

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI analysis unavailable' }, { status: 503 })
  }

  try {
    const ctx = await getAuthedContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    sweepExpired()
    const rl = rateLimit(`analyze:${ctx.userId}`, 30, 60_000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })
    }

    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }
    if (imageBase64.length > MAX_BASE64_LEN) {
      return NextResponse.json({ error: 'Image too large (max ~5MB)' }, { status: 413 })
    }
    const type = typeof mediaType === 'string' ? mediaType : 'image/jpeg'
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
    }

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
                media_type: type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
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

    let parsed
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      console.error('Analyze: AI returned non-JSON')
      return NextResponse.json({ error: 'Could not read that photo, please retry' }, { status: 502 })
    }

    // Sanitize category
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = 'tops'

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Analyze error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
