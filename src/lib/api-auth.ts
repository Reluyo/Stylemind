import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ClothingItem, Plan } from '@/lib/types'

export interface AuthedContext {
  userId: string
  plan: Plan
  stylePreferences: string[]
  supabase: ReturnType<typeof createServerSupabaseClient>
}

/**
 * Verifies the session and loads plan + style preferences server-side.
 * Returns null if unauthenticated.
 */
export async function getAuthedContext(): Promise<AuthedContext | null> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, style_preferences')
    .eq('id', user.id)
    .single()

  return {
    userId: user.id,
    plan: (profile?.plan ?? 'free') as Plan,
    stylePreferences: profile?.style_preferences ?? [],
    supabase,
  }
}

/**
 * Loads the user's wardrobe from the database — never trust client-sent items.
 */
export async function loadWardrobe(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string
): Promise<ClothingItem[]> {
  const { data } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
  return data ?? []
}
