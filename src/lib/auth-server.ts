import { createServerSupabaseClient } from './supabase-server'
import type { Profile } from './types'

// Resolve the authenticated user and their profile in one call, for use in
// route handlers that need to enforce plan limits. Returns nulls when there is
// no valid session so callers can return 401 themselves.
export async function getUserAndProfile() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null as Profile | null, supabase }
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return { user, profile: profile as Profile | null, supabase }
}
