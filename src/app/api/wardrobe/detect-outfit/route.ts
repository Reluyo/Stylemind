import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserAndProfile } from '@/lib/auth-server'

const VALID_CATEGORIES = ['tops', 'bottoms', 'dresses', 'shoes', 'accessories', 'outerwear']

// Detect every distinct clothing item worn in a single full-outfit photo and
// return them as separate, catalog-ready entries. The frontend lets the user
// review/edit before saving each to the wardrobe.
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI analysis unavailable' }, { status: 503 })
  }

  const { user } = await getUserAndProfile()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
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
              text: `This is a photo of a person wearing an outfit. Identify each distinct clothing item and accessory they are wearing (e.g. shirt, jacket, trousers, shoes, bag, belt, hat, sunglasses, watch). Ignore the person, background, and anything not worn.

Respond ONLY with valid JSON (no markdown), an array of items:
[{"name":"descriptive item name","category":"one of: tops/bottoms/dresses/shoes/accessories/outerwear","color":"main color(s)","tags":["2-4 style tags like casual/formal/summer"]}]

Only include items you can clearly see. If you can only see part of an item, still include it. Do not invent items.`,
            },
          ],
        },
      ],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    let parsed: unknown
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Could not read the outfit — try a clearer photo.' }, { status: 422 })
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: 'No items detected.' }, { status: 422 })
    }

    // Sanitize each detected item.
    const items = parsed
      .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object')
      .map((it) => ({
        name: typeof it.name === 'string' ? it.name.slice(0, 80) : 'Clothing item',
        category: VALID_CATEGORIES.includes(it.category as string) ? (it.category as string) : 'tops',
        color: typeof it.color === 'string' ? it.color.slice(0, 40) : '',
        tags: Array.isArray(it.tags) ? it.tags.filter((t) => typeof t === 'string').slice(0, 4) : [],
      }))

    if (!items.length) {
      return NextResponse.json({ error: 'No items detected in this photo.' }, { status: 422 })
    }

    return NextResponse.json({ items })
  } catch (err) {
    console.error('Detect-outfit error:', err)
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}
