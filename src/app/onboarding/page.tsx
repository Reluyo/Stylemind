'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MapPin, LocateFixed, Loader2, Sparkles, Shirt, Check, ArrowRight, Plus, ScanLine, Camera } from 'lucide-react'
import AddItemModal from '@/components/AddItemModal'
import type { ClothingCategory } from '@/lib/types'

const STYLE_OPTIONS = [
  'Minimalist', 'Classic', 'Bohemian', 'Streetwear',
  'Sporty', 'Feminine', 'Edgy', 'Preppy',
  'Business Casual', 'Eclectic',
]

// The minimum spread to generate a believable first outfit.
const QUICK_SLOTS: { label: string; category: ClothingCategory }[] = [
  { label: 'A top', category: 'tops' },
  { label: 'Bottoms', category: 'bottoms' },
  { label: 'Shoes', category: 'shoes' },
  { label: 'Outerwear', category: 'outerwear' },
  { label: 'Accessory', category: 'accessories' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [step, setStep] = useState(1)
  const [location, setLocation] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [stylePrefs, setStylePrefs] = useState<string[]>([])
  const [finishing, setFinishing] = useState(false)
  // Quick-start (step 4) state: which categories the user has filled.
  const [filledCats, setFilledCats] = useState<ClothingCategory[]>([])
  const [addingCat, setAddingCat] = useState<ClothingCategory | null>(null)

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

  // Persist location + style prefs and mark onboarded.
  async function saveProfile() {
    const supabase = createClient()
    await supabase.from('profiles').update({
      location: location.trim() || null,
      style_preferences: stylePrefs,
      onboarded: true,
    }).eq('id', userId)
  }

  // Seed a demo wardrobe so the user reaches the "aha" (real outfit
  // generation) without first uploading a dozen photos.
  async function finishWithSample() {
    if (!userId) return
    setFinishing(true)
    const supabase = createClient()
    await saveProfile()
    await supabase.rpc('seed_demo_wardrobe', { p_user_id: userId })
    router.replace('/today')
    router.refresh()
  }

  // Finish from the quick-start grid. The user has added a few real items —
  // mark onboarded and drop them on Today, which auto-generates the first
  // outfit. `?generate=1` tells Today to fire generation immediately.
  async function finishQuickStart() {
    if (!userId) return
    setFinishing(true)
    await saveProfile()
    router.replace('/today?generate=1')
    router.refresh()
  }

  // Skip quick-start: save profile, show the "how to add items" explainer
  // (step 5) so the user isn't dropped on an empty Today with no context.
  async function skipToExplainer() {
    if (!userId) return
    setFinishing(true)
    await saveProfile()
    setFinishing(false)
    setStep(5)
  }

  return (
    <div className="min-h-screen flex flex-col max-w-[430px] mx-auto px-6 pt-10 pb-8 relative z-10">
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
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
            onClick={finishWithSample}
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
            onClick={() => setStep(4)}
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

      {step === 4 && (
        <div className="flex-1 flex flex-col">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1.5">Add a few pieces</h1>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            Add at least a top, bottoms and shoes — that&apos;s enough for your first outfit. AI fills in the
            details from each photo.
          </p>

          <div className="space-y-2.5">
            {QUICK_SLOTS.map(({ label, category }) => {
              const done = filledCats.includes(category)
              return (
                <button
                  key={category}
                  onClick={() => setAddingCat(category)}
                  className="w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all hover:bg-stone-50"
                  style={done ? { borderColor: '#AA8EA0', background: '#FAF6F9' } : { borderColor: '#e7e3e6' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: done ? '#AA8EA0' : '#F5EEF3' }}
                  >
                    {done ? <Check size={16} className="text-white" /> : <Plus size={16} style={{ color: '#AA8EA0' }} />}
                  </div>
                  <p className="font-medium text-stone-800 text-sm">{label}</p>
                  {done && <span className="ml-auto text-xs font-medium" style={{ color: '#AA8EA0' }}>Added</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-auto pt-8 flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-3.5 rounded-full font-medium text-sm border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={finishQuickStart}
              disabled={finishing || filledCats.length < 2}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#AA8EA0' }}
            >
              {finishing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {filledCats.length < 2 ? 'Add a couple items' : 'Generate my first outfit'}
            </button>
          </div>
          <button
            onClick={skipToExplainer}
            disabled={finishing}
            className="w-full mt-3 text-center text-sm text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="flex-1 flex flex-col">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1.5">Two ways to add clothes</h1>
          <p className="text-sm text-stone-500 mb-7 leading-relaxed">
            Whenever you&apos;re ready, here&apos;s how to build your wardrobe. Both options live in the
            Wardrobe tab.
          </p>

          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-100 p-4 flex gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#F5EEF3' }}
              >
                <Camera size={20} style={{ color: '#AA8EA0' }} />
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-sm mb-1">One item at a time</p>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Tap <strong>Add item</strong> and snap a photo of a single garment. AI fills in the
                  name, category, and colour automatically — just review and save.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-100 p-4 flex gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#F5EEF3' }}
              >
                <ScanLine size={20} style={{ color: '#AA8EA0' }} />
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-sm mb-1">From an outfit photo</p>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Tap <strong>From photo</strong> and upload a picture of yourself wearing an outfit.
                  AI detects every visible piece — jacket, trousers, shoes, accessories — and adds them
                  as separate wardrobe items in one go.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <button
              onClick={() => { router.replace('/today'); router.refresh() }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90"
              style={{ background: '#AA8EA0' }}
            >
              Go to StyleMind <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {addingCat && (
        <AddItemModal
          userId={userId}
          initialCategory={addingCat}
          onClose={() => setAddingCat(null)}
          onSaved={() => {
            setFilledCats((prev) => prev.includes(addingCat) ? prev : [...prev, addingCat])
            setAddingCat(null)
          }}
          onSavedContinue={() => {
            setFilledCats((prev) => prev.includes(addingCat) ? prev : [...prev, addingCat])
          }}
        />
      )}
    </div>
  )
}
