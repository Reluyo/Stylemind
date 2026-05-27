'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, Sparkles, MapPin, Edit2 } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingLocation, setEditingLocation] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')

      const [{ data: prof }, { count }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('clothing_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setProfile(prof)
      setItemCount(count ?? 0)
      setLocationInput(prof?.location ?? '')
      setLoading(false)
    }
    load()
  }, [router])

  async function saveLocation() {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ location: locationInput }).eq('id', profile.id)
    setProfile({ ...profile, location: locationInput })
    setEditingLocation(false)
    setSaving(false)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  const isPro = profile?.plan === 'pro'

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <div className="h-6 w-32 rounded bg-stone-100 animate-pulse mb-6" />
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-stone-100 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 rounded bg-stone-100 animate-pulse" />
            <div className="h-3 w-32 rounded bg-stone-100 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Profile</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold font-serif flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C8956C, #8B5E3C)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900 text-lg leading-snug truncate">
            {profile?.full_name ?? 'Unnamed'}
          </p>
          <p className="text-sm text-stone-400 truncate">{email}</p>
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full mt-1"
            style={{
              background: isPro ? '#C8956C' : '#F5EDE6',
              color: isPro ? 'white' : '#8B5E3C',
            }}
          >
            {isPro && <Sparkles size={10} />}
            {isPro ? 'Pro' : 'Free plan'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Wardrobe items" value={itemCount} />
        <StatCard label="Plan" value={isPro ? 'Pro' : 'Free'} />
      </div>

      {/* Upgrade banner (free users) */}
      {!isPro && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: 'linear-gradient(135deg, #C8956C, #8B5E3C)' }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">Upgrade to Pro</p>
              <p className="text-white/80 text-xs mt-0.5 leading-relaxed">
                Unlimited items, 5 daily outfits, AI Stylist chat, week planner, and more.
              </p>
              <button className="mt-3 bg-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-all"
                style={{ color: '#8B5E3C' }}
                onClick={() => alert('Stripe integration coming soon!')}>
                Upgrade for $9/mo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Settings</p>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3.5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} style={{ color: '#C8956C' }} />
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Location</span>
          </div>
          {editingLocation ? (
            <div className="flex gap-2 mt-2">
              <input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveLocation()}
                className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#C8956C]"
                placeholder="New York, US"
                autoFocus
              />
              <button
                onClick={saveLocation}
                disabled={saving}
                className="text-sm font-medium px-4 py-2 rounded-xl text-white hover:opacity-80 transition-all disabled:opacity-50"
                style={{ background: '#C8956C' }}
              >
                {saving ? '…' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-stone-700">{profile?.location || 'Not set'}</span>
              <button
                onClick={() => setEditingLocation(true)}
                className="p-1.5 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <Edit2 size={13} className="text-stone-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 transition-all"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 px-4 py-4 text-center">
      <p className="text-2xl font-bold font-serif text-stone-900">{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{label}</p>
    </div>
  )
}
