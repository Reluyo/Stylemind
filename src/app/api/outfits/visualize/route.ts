import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ClothingItem } from '@/lib/types'

const VIZ_LIMIT = 40

// Map wardrobe categories to IDM-VTON categories
const CATEGORY_MAP: Record<string, string> = {
  tops: 'upper_body',
  outerwear: 'upper_body',
  dresses: 'dresses',
  bottoms: 'lower_body',
}

// Pick most visually impactful item from an outfit (prefer dresses > tops > outerwear > bottoms)
const HERO_PRIORITY = ['dresses', 'tops', 'outerwear', 'bottoms']

function pickHeroItem(wardrobeItems: ClothingItem[], outfitItemNames: string[]): ClothingItem | null {
  const outfitSet = new Set(outfitItemNames.map((n) => n.toLowerCase()))
  const candidates = wardrobeItems.filter(
    (item) =>
      (item.thumbnail_url || item.image_url) &&
      CATEGORY_MAP[item.category] &&
      (outfitSet.has(item.name.toLowerCase()) ||
        Array.from(outfitSet).some((n) => n.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(n)))
  )
  for (const cat of HERO_PRIORITY) {
    const match = candidates.find((c) => c.category === cat)
    if (match) return match
  }
  return null
}

// POST /api/outfits/visualize — start a prediction, return predictionId
export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Visualization unavailable' }, { status: 503 })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, profile_photo_url, viz_count, viz_reset_month')
    .eq('id', user.id)
    .single()

  if (profile?.plan !== 'pro') {
    return NextResponse.json({ error: 'Premium required', code: 'NOT_PRO' }, { status: 403 })
  }
  if (!profile.profile_photo_url) {
    return NextResponse.json({ error: 'Upload a profile photo first', code: 'NO_PHOTO' }, { status: 400 })
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const resetNeeded = profile.viz_reset_month !== currentMonth
  const usedCount = resetNeeded ? 0 : (profile.viz_count ?? 0)

  if (usedCount >= VIZ_LIMIT) {
    return NextResponse.json(
      { error: `Monthly limit reached (${VIZ_LIMIT}/month)`, code: 'LIMIT_REACHED', limit: VIZ_LIMIT },
      { status: 429 }
    )
  }

  const { outfitItemNames, wardrobeItems }: {
    outfitItemNames: string[]
    wardrobeItems: ClothingItem[]
  } = await req.json()

  const hero = pickHeroItem(wardrobeItems, outfitItemNames)
  if (!hero) {
    return NextResponse.json({ error: 'No outfit items with photos found' }, { status: 400 })
  }

  const garmentUrl = hero.thumbnail_url ?? hero.image_url!
  const tryOnCategory = CATEGORY_MAP[hero.category]

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  const prediction = await replicate.predictions.create({
    version: 'c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4',
    input: {
      human_img: profile.profile_photo_url,
      garm_img: garmentUrl,
      garment_des: `${hero.color ? hero.color + ' ' : ''}${hero.name}`,
      category: tryOnCategory,
      is_checked: true,
      is_checked_crop: false,
    },
  })

  // Increment usage counter
  await supabase.from('profiles').update({
    viz_count: usedCount + 1,
    viz_reset_month: currentMonth,
  }).eq('id', user.id)

  return NextResponse.json({
    predictionId: prediction.id,
    used: usedCount + 1,
    limit: VIZ_LIMIT,
  })
}

// GET /api/outfits/visualize?id=<predictionId> — poll prediction status
export async function GET(req: NextRequest) {
  const predictionId = req.nextUrl.searchParams.get('id')
  if (!predictionId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  const prediction = await replicate.predictions.get(predictionId)

  if (prediction.status === 'succeeded') {
    const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
    return NextResponse.json({ status: 'succeeded', imageUrl })
  }
  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    return NextResponse.json({ status: 'failed', error: prediction.error ?? 'Generation failed' })
  }
  return NextResponse.json({ status: prediction.status })
}
