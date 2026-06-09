'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MapPin, LocateFixed, Loader2, Sparkles, Shirt, Check, ArrowRight } from 'lucide-react'

const STYLE_OPTIONS = [
  'Minimalist', 'Classic', 'Bohemian', 'Streetwear',
  'Sporty', 'Feminine', 'Edgy', 'Preppy',
  'Business Casual', 'Eclectic',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [step, setStep] = useState(1)
  const [location, setLocation] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [stylePrefs, setStylePrefs] = useState<string[]>([])
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded, location, style_preferences')
        .eq('id', user.id)
        .single()
      // Already onboarded — skip straight to the app.
      if (profile?.onboarded) { router.replace('/today'); return }
      if (profile?.location) setLocation(profile.location)
      if (profile?.style_preferences?.length) setStylePrefs(profile.style_preferences)
    }
    load()
  }, [router])

  function detectLocation() {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
          const country = data.address?.country_code?.toUpperCase() ?? ''
          setLocation(city && country ? `${city}, ${country}` : city || '')
        } finally {
          setDetecting(false)
        }
      },
      () => setDetecting(false)
    )
  }

  function toggleStyle(s: string) {
    setStylePrefs((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  // Persist location + style prefs and mark onboarded. `withSample` seeds a
  // demo wardrobe so the user reaches the "aha" (real outfit generation)
  // without first uploading a dozen photos.
  async function finish(withSample: boolean) {
    if (!userId) return
    setFinishing(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      location: location.trim() || null,
      style_preferences: stylePrefs,
      onboarded: true,
    }).eq('id', userId)

    if (withSample) {
      await supabase.rpc('seed_demo_wardrobe', { p_user_id: userId })
      router.replace('/today')
    } else {
      // Send them to the wardrobe with the add sheet primed.
      router.replace('/wardrobe?add=1')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col max-w-[430px] mx-auto px-6 pt-10 pb-8 relative z-10">
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="h-1.5 rounded-full flex-1 transition-all"
            style={{ background: s <= step ? '#AA8EA0' : '#E7E3E6' }}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1.5">Where are you based?</h1>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            StyleMind matches outfits to your local weather. We&apos;ll only use this for the forecast.
          </p>
          <div className="relative mb-3">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="New York, US"
              autoFocus
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors bg-white"
            />
          </div>
          <button
            onClick={detectLocation}
            disabled={detecting}
            className="flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-60"
          >
            {detecting ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            Use my current location
          </button>

          <div className="mt-auto pt-8">
            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90"
              style={{ background: '#AA8EA0' }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1.5">What&apos;s your style?</h1>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            Pick a few — StyleMind tailors every suggestion to match. You can change these anytime.
          </p>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((s) => {
              const active = stylePrefs.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleStyle(s)}
                  className="text-sm font-medium px-3.5 py-2 rounded-full border transition-all"
                  style={active
                    ? { background: '#AA8EA0', color: 'white', borderColor: '#AA8EA0' }
                    : { background: 'white', color: '#4a3545', borderColor: '#e7e3e6' }}
                >
                  {s}
                </button>
              )
            })}
          </div>

          <div className="mt-auto pt-8 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3.5 rounded-full font-medium text-sm border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90"
              style={{ background: '#AA8EA0' }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1.5">Build your wardrobe</h1>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            StyleMind needs a few items before it can style you. Start with a sample closet to see it work
            instantly, or add your own pieces.
          </p>

          <button
            onClick={() => finish(true)}
            disabled={finishing}
            className="w-full text-left rounded-2xl border-2 p-4 mb-3 transition-all hover:opacity-90 disabled:opacity-60"
            style={{ borderColor: '#AA8EA0', background: '#FAF6F9' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#AA8EA0' }}>
                {finishing ? <Loader2 size={18} className="animate-spin text-white" /> : <Sparkles size={18} className="text-white" />}
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-sm">Start with a sample closet</p>
                <p className="text-xs text-stone-500 mt-0.5">24 curated pieces — generate outfits right away</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => finish(false)}
            disabled={finishing}
            className="w-full text-left rounded-2xl border border-stone-200 p-4 transition-all hover:bg-stone-50 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5EEF3' }}>
                <Shirt size={18} style={{ color: '#AA8EA0' }} />
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-sm">Add my own items</p>
                <p className="text-xs text-stone-500 mt-0.5">Snap photos — AI fills in the details</p>
              </div>
            </div>
          </button>

          <div className="mt-auto pt-8">
            <button
              onClick={() => setStep(2)}
              className="text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-1"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
