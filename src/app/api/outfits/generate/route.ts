import { NextRequest, NextResponse } from 'next/server'
import { generateOutfits } from '@/lib/ai'
import { getUserAndProfile } from '@/lib/auth-server'
import { FREE_DAILY_GENERATIONS, FREE_OUTFIT_COUNT, PRO_OUTFIT_COUNT } from '@/lib/plan'
import { ClothingItem, WeatherSummary } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { user, profile, supabase } = await getUserAndProfile()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { items, weather, stylePreferences, styleExpression }: {
      items: ClothingItem[]
      weather: WeatherSummary
      stylePreferences?: string[]
      styleExpression?: string
    } = await req.json()
    if (!items?.length) return NextResponse.json({ error: 'No wardrobe items provided' }, { status: 400 })

    const isPro = profile?.plan === 'pro'

    // Atomically claim a daily generation slot (enforces the free-tier cap
    // server-side; pro is unmetered). Returns the new daily count, or null
    // when the free limit is already used up.
    const { data: claimed, error: claimErr } = await supabase.rpc('claim_outfit_generation', {
      p_user_id: user.id,
      p_limit: FREE_DAILY_GENERATIONS,
    })

    if (!claimErr && claimed === null && !isPro) {
      return NextResponse.json(
        {
          error: `You've used all ${FREE_DAILY_GENERATIONS} free outfit generations today. Upgrade to Pro for unlimited.`,
          code: 'DAILY_LIMIT',
          limit: FREE_DAILY_GENERATIONS,
        },
        { status: 429 }
      )
    }

    // Exclude items currently in laundry from AI consideration
    const availableItems = items.filter((i) => !i.in_laundry)

    // Fetch outfit names worn in the last 7 days to avoid repeating
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: recentWears } = await supabase
      .from('wear_log')
      .select('outfit_name')
      .eq('user_id', user.id)
      .gte('worn_date', sevenDaysAgo)
    const recentlyWorn = (recentWears ?? [])
      .map((r) => r.outfit_name)
      .filter((n): n is string => !!n)

    const count = isPro ? PRO_OUTFIT_COUNT : FREE_OUTFIT_COUNT
    const outfits = await generateOutfits(availableItems.length ? availableItems : items, weather, stylePreferences ?? [], count, styleExpression ?? profile?.style_expression ?? 'no_preference', recentlyWorn)

    const remaining = isPro
      ? null
      : Math.max(0, FREE_DAILY_GENERATIONS - (typeof claimed === 'number' ? claimed : FREE_DAILY_GENERATIONS))

    return NextResponse.json({ outfits, plan: profile?.plan ?? 'free', remaining })
  } catch (err) {
    console.error('Generate outfits error:', err)
    return NextResponse.json({ error: 'Failed to generate outfits' }, { status: 500 })
  }
}
