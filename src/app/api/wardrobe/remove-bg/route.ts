import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getUserAndProfile } from '@/lib/auth-server'

// Remove the background from a cropped garment image so each detected item
// becomes a clean isolated cutout (much better for the Pro try-on feature).
// Best-effort: callers fall back to the raw crop if this is unavailable.
export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Background removal unavailable' }, { status: 503 })
  }

  const { user } = await getUserAndProfile()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    // Use the deployment URL so we always get the latest published version
    // without having to maintain a hardcoded version hash.
    const output = await replicate.run(
      'cjwbw/rembg' as `${string}/${string}`,
      { input: { image: imageUrl } }
    )

    const cleanUrl = Array.isArray(output) ? output[0] : output
    if (!cleanUrl || typeof cleanUrl !== 'string') {
      return NextResponse.json({ error: 'No output' }, { status: 502 })
    }

    return NextResponse.json({ imageUrl: cleanUrl })
  } catch (err) {
    console.error('remove-bg error:', err)
    return NextResponse.json({ error: 'Background removal failed' }, { status: 500 })
  }
}
