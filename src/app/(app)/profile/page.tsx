'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, Sparkles, MapPin, Edit2, Camera, Loader2, Image as ImageIcon, LocateFixed, Bell, Lock } from 'lucide-react'
import type { Profile } from '@/lib/types'
import StyleExpressionPicker, { type StyleExpression } from '@/components/StyleExpressionPicker'

const VIZ_LIMIT = 40

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingLocation, setEditingLocation] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [notifFreq, setNotifFreq] = useState<'daily' | 'weekly' | 'none'>('daily')
  const [reminderTime, setReminderTime] = useState('07:30')
  const [savingNotif, setSavingNotif] = useState(false)
  const [stylePrefs, setStylePrefs] = useState<string[]>([])
  const [styleExpression, setStyleExpression] = useState<StyleExpression>('no_preference')
  const [savingStyle, setSavingStyle] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)

  const STYLE_OPTIONS = [
    'Minimalist', 'Classic', 'Bohemian', 'Streetwear',
    'Sporty', 'Feminine', 'Edgy', 'Preppy',
    'Business Casual', 'Eclectic',
  ]

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
      setNotifFreq(prof?.notification_frequency ?? 'daily')
      setReminderTime(prof?.morning_reminder_time ?? '07:30')
      setStylePrefs(prof?.style_preferences ?? [])
      setStyleExpression((prof?.style_expression ?? 'no_preference') as StyleExpression)
      setLoading(false)
    }
    load()
  }, [router])

  async function uploadProfilePhoto(file: File) {
    if (!profile || !file.type.startsWith('image/')) return
    setUploadingPhoto(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${profile.id}/profile.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (uploadError) return
      const { data: { publicUrl } } = supabase.storage.from('wardrobe-images').getPublicUrl(path)
      await supabase.from('profiles').update({ profile_photo_url: publicUrl }).eq('id', profile.id)
      setProfile({ ...profile, profile_photo_url: publicUrl })
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function saveLocation() {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ location: locationInput }).eq('id', profile.id)
    setProfile({ ...profile, location: locationInput })
    setEditingLocation(false)
    setSaving(false)
  }

  async function detectLocation() {
    if (!navigator.geolocation) return
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
          const country = data.address?.country_code?.toUpperCase() ?? ''
          const loc = city && country ? `${city}, ${country}` : city || 'Unknown'
          setLocationInput(loc)
          if (profile) {
            const supabase = createClient()
            await supabase.from('profiles').update({ location: loc }).eq('id', profile.id)
            setProfile({ ...profile, location: loc })
          }
        } finally {
          setDetectingLocation(false)
        }
      },
      () => setDetectingLocation(false)
    )
  }

  async function saveStylePrefs() {
    if (!profile) return
    setSavingStyle(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ style_preferences: stylePrefs, style_expression: styleExpression }).eq('id', profile.id)
    setProfile({ ...profile, style_preferences: stylePrefs, style_expression: styleExpression })
    setSavingStyle(false)
  }

  function toggleStyle(s: string) {
    setStylePrefs((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function saveNotifSettings() {
    if (!profile) return
    setSavingNotif(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      notification_frequency: notifFreq,
      morning_reminder_time: reminderTime,
    }).eq('id', profile.id)
    setProfile({ ...profile, notification_frequency: notifFreq, morning_reminder_time: reminderTime })
    setSavingNotif(false)
  }

  async function startCheckout() {
    setCheckingOut(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setCheckingOut(false)
    }
  }

  async function openPortal() {
    setOpeningPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setOpeningPortal(false)
    }
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
        {/* Tapping the avatar opens the file picker on all devices */}
        <label className="relative w-16 h-16 rounded-full flex-shrink-0 cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadProfilePhoto(f)
              e.target.value = ''
            }}
          />
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-md">
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-xl font-bold font-serif"
                style={{ background: 'linear-gradient(135deg, #AA8EA0, #725265)' }}
              >
                {initials}
              </div>
            )}
          </div>
          {/* Camera badge */}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
            style={{ background: '#AA8EA0' }}
          >
            {uploadingPhoto
              ? <Loader2 size={9} className="animate-spin text-white" />
              : <Camera size={9} className="text-white" />}
          </div>
        </label>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900 text-lg leading-snug truncate">
            {profile?.full_name ?? 'Unnamed'}
          </p>
          <p className="text-sm text-stone-400 truncate">{email}</p>
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full mt-1"
            style={{
              background: isPro ? '#AA8EA0' : '#F5EEF3',
              color: isPro ? 'white' : '#725265',
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

      {/* Manage subscription (Pro users) */}
      {isPro && (
        <div className="mb-6">
          <button
            onClick={openPortal}
            disabled={openingPortal}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 transition-all disabled:opacity-60"
          >
            {openingPortal && <Loader2 size={13} className="animate-spin" />}
            Manage subscription
          </button>
        </div>
      )}

      {/* Upgrade banner (free users) */}
      {!isPro && (
        <div
          className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #AA8EA0, #725265)' }}
        >
          <div className="logo-watermark absolute -right-4 -bottom-4 w-28 h-36 opacity-[0.12]" aria-hidden="true" />
          <div className="flex items-start gap-3 relative">
            <Sparkles size={20} className="text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">Upgrade to Pro</p>
              <p className="text-white/80 text-xs mt-0.5 leading-relaxed">
                Unlimited items, 5 daily outfits, AI Stylist chat, week planner, and more.
              </p>
              <button
                className="mt-3 bg-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
                style={{ color: '#725265' }}
                onClick={startCheckout}
                disabled={checkingOut}
              >
                {checkingOut && <Loader2 size={13} className="animate-spin" />}
                Upgrade for $9/mo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Try-on photo */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Outfit Visualization</p>
        <div className={`bg-white rounded-2xl border border-stone-100 p-4 ${!isPro ? 'opacity-60' : ''}`}>
          {!isPro && (
            <div className="flex items-center gap-2 mb-2">
              <Lock size={13} style={{ color: '#AA8EA0' }} />
              <span className="text-xs font-semibold" style={{ color: '#AA8EA0' }}>Pro feature — upgrade to unlock</span>
            </div>
          )}
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">
            Upload a full-body photo of yourself to try outfits on virtually.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-100">
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="Your photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#F5EEF3' }}>
                  <ImageIcon size={24} style={{ color: '#AA8EA0', opacity: 0.5 }} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label
                className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all cursor-pointer hover:opacity-80 ${!isPro || uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ background: '#F5EEF3', color: '#725265' }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={!isPro || uploadingPhoto}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadProfilePhoto(f)
                    e.target.value = ''
                  }}
                />
                {uploadingPhoto ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
                {profile?.profile_photo_url ? 'Replace photo' : 'Upload photo'}
              </label>
              <p className="text-xs text-stone-400 mt-1.5">Full-body photo works best</p>
            </div>
          </div>
          {isPro && (
            <div className="mt-3 pt-3 border-t border-stone-50">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-stone-400">Visualizations this month</p>
                <span className="text-xs font-medium" style={{ color: '#AA8EA0' }}>
                  {profile?.viz_count ?? 0} / {VIZ_LIMIT}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-100">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    background: '#AA8EA0',
                    width: `${Math.min(100, ((profile?.viz_count ?? 0) / VIZ_LIMIT) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Settings</p>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3.5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} style={{ color: '#AA8EA0' }} />
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Location</span>
          </div>
          {editingLocation ? (
            <div className="flex gap-2 mt-2">
              <input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveLocation()}
                className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#AA8EA0]"
                placeholder="New York, US"
                autoFocus
              />
              <button
                onClick={saveLocation}
                disabled={saving}
                className="text-sm font-medium px-4 py-2 rounded-xl text-white hover:opacity-80 transition-all disabled:opacity-50"
                style={{ background: '#AA8EA0' }}
              >
                {saving ? '…' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-stone-700">{profile?.location || 'Not set'}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="p-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                  title="Use device location"
                >
                  {detectingLocation ? <Loader2 size={13} className="text-stone-400 animate-spin" /> : <LocateFixed size={13} className="text-stone-400" />}
                </button>
                <button onClick={() => setEditingLocation(true)} className="p-1.5 rounded-lg hover:bg-stone-50 transition-colors">
                  <Edit2 size={13} className="text-stone-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3.5">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} style={{ color: '#AA8EA0' }} />
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Morning reminder</span>
          </div>
          {/* Frequency */}
          <div className="flex gap-2 mb-3">
            {(['daily', 'weekly', 'none'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setNotifFreq(f)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
                  notifFreq === f ? 'text-white' : 'bg-stone-50 border border-stone-200 text-stone-600'
                }`}
                style={notifFreq === f ? { background: '#AA8EA0' } : {}}
              >
                {f === 'none' ? 'Off' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {/* Time picker — only when not off */}
          {notifFreq !== 'none' && (
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors mb-3"
            />
          )}
          <button
            onClick={saveNotifSettings}
            disabled={savingNotif}
            className="w-full py-2 rounded-xl text-xs font-medium text-white transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: '#AA8EA0' }}
          >
            {savingNotif ? 'Saving…' : 'Save reminder'}
          </button>
        </div>
      </div>

      {/* Style preferences */}
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Style Preferences</p>
        <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3.5">
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">
            Pick your styles — StyleMind will tailor outfit suggestions to match.
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {STYLE_OPTIONS.map((s) => {
              const active = stylePrefs.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleStyle(s)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
                  style={active
                    ? { background: '#AA8EA0', color: 'white', borderColor: '#AA8EA0' }
                    : { background: 'white', color: '#4a3545', borderColor: '#e7e3e6' }
                  }
                >
                  {s}
                </button>
              )
            })}
          </div>

          <div className="mb-4">
            <StyleExpressionPicker value={styleExpression} onChange={setStyleExpression} />
          </div>

          <button
            onClick={saveStylePrefs}
            disabled={savingStyle}
            className="w-full py-2 rounded-xl text-xs font-medium text-white transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: '#AA8EA0' }}
          >
            {savingStyle ? 'Saving…' : 'Save style preferences'}
          </button>
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
