'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sparkles, Send, RefreshCw, CloudSun, ChevronRight, Bookmark, BookmarkCheck, Wand2, Lock } from 'lucide-react'
import type { AIOutfitSuggestion, ClothingItem, WeatherSummary } from '@/lib/types'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

const REFINE_CHIPS = [
  'More casual',
  'More formal',
  'Something bolder',
  'Warmer layers',
  'Work-appropriate',
]

const CATEGORY_COLORS: Record<string, string> = {
  tops: '#EDE8F5',
  bottoms: '#EBF3EC',
  dresses: '#F5E8F0',
  shoes: '#F0EDE8',
  accessories: '#E8EFF5',
  outerwear: '#F0EBF2',
}

export default function TodayPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [weather, setWeather] = useState<WeatherSummary | null>(null)
  const [items, setItems] = useState<ClothingItem[]>([])
  const [outfits, setOutfits] = useState<AIOutfitSuggestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isPro, setIsPro] = useState(false)
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false)
  const [plannedOutfitAlert, setPlannedOutfitAlert] = useState<{ outfitName: string; message: string; type: 'rain' | 'cold' | 'hot' } | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, location, plan, profile_photo_url, style_preferences')
        .eq('id', user.id)
        .single()

      setUserName(profile?.full_name?.split(' ')[0] ?? '')
      setIsPro(profile?.plan === 'pro')
      setHasProfilePhoto(!!profile?.profile_photo_url)
      const loc = profile?.location ?? 'New York'
      // Store style prefs so generateOutfits can use them
      if (profile?.style_preferences?.length) {
        sessionStorage.setItem('sm_style_prefs', JSON.stringify(profile.style_preferences))
      }

      const [{ data: clothing }, weatherRes] = await Promise.all([
        supabase.from('clothing_items').select('*').eq('user_id', user.id),
        fetch(`/api/weather?location=${encodeURIComponent(loc)}`),
      ])
      const weatherData: WeatherSummary = await weatherRes.json()
      setItems(clothing ?? [])
      setWeather(weatherData)

      // Once-per-day planned outfit weather check
      const today = new Date().toISOString().slice(0, 10)
      const cacheKey = `outfit_weather_check_${user.id}_${today}`
      if (!localStorage.getItem(cacheKey)) {
        const { data: planned } = await supabase
          .from('planned_outfits')
          .select('outfit_id, outfits(name)')
          .eq('user_id', user.id)
          .eq('planned_date', today)
          .maybeSingle()

        if (planned?.outfit_id) {
          const cond = weatherData.condition.toLowerCase()
          const temp = weatherData.temp_f
          // Supabase may return joined row as object or single-element array
          const outfitsRow = planned.outfits as unknown as { name: string } | { name: string }[] | null
          const outfitName = (Array.isArray(outfitsRow) ? outfitsRow[0]?.name : outfitsRow?.name) ?? 'your planned outfit'
          let alert: typeof plannedOutfitAlert = null
          if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
            alert = { outfitName, message: 'Rain expected — consider waterproof shoes or an umbrella.', type: 'rain' }
          } else if (temp < 45) {
            alert = { outfitName, message: `Only ${temp}°F today — your planned outfit may need an extra layer.`, type: 'cold' }
          } else if (temp > 88) {
            alert = { outfitName, message: `${temp}°F today — your planned outfit might be too warm.`, type: 'hot' }
          }
          if (alert) {
            setPlannedOutfitAlert(alert)
            localStorage.setItem(cacheKey, '1')
          }
        }
      }
    }
    init()
  }, [router])

  async function generateOutfits() {
    if (!items.length || !weather) return
    setGenerating(true)
    setOutfits([])
    try {
      const res = await fetch('/api/outfits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          weather,
          stylePreferences: JSON.parse(sessionStorage.getItem('sm_style_prefs') ?? '[]'),
        }),
      })
      const data = await res.json()
      setOutfits(data.outfits ?? [])
    } finally {
      setGenerating(false)
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const newMessages: ChatMsg[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)
    setStreamingText('')

    const res = await fetch('/api/stylist/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, items, weather }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value, { stream: true })
      setStreamingText(full)
    }
    setMessages((prev) => [...prev, { role: 'assistant', content: full }])
    setStreamingText('')
    setStreaming(false)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Pick items to suggest: season-matching first, then fallback to first 6
  const currentSeason = weather?.season ?? ''
  const suggestedItems = [
    ...items.filter((i) => i.season?.includes(currentSeason) || i.season?.includes('All')),
    ...items.filter((i) => !i.season?.includes(currentSeason) && !i.season?.includes('All')),
  ].slice(0, 6)

  return (
    <div className="px-4 pt-6">
      {/* Header — leaves space for hamburger button on the right */}
      <div className="mb-5 pr-10">
        <p className="text-stone-400 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          {userName ? `What will we wear today, ${userName}?` : 'What will we wear today?'}
        </h1>
      </div>

      {/* Weather bar */}
      {weather && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(170,142,160,0.2)' }}
        >
          <CloudSun size={20} style={{ color: '#AA8EA0' }} />
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-800">
              {weather.temp_f}°F · {weather.condition}
            </p>
            <p className="text-xs text-stone-400">{weather.location} · {weather.season}</p>
          </div>
          <ChevronRight size={14} className="text-stone-300" />
        </div>
      )}

      {/* Planned outfit weather alert */}
      {plannedOutfitAlert && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-5 border"
          style={{
            background: plannedOutfitAlert.type === 'rain' ? '#EBF3EC' : plannedOutfitAlert.type === 'cold' ? '#EDE8F5' : '#F5EEE8',
            borderColor: plannedOutfitAlert.type === 'rain' ? '#A8BAA8' : plannedOutfitAlert.type === 'cold' ? '#AA8EA0' : '#C8A882',
          }}
        >
          <span className="text-lg flex-shrink-0">
            {plannedOutfitAlert.type === 'rain' ? '🌧️' : plannedOutfitAlert.type === 'cold' ? '🧥' : '☀️'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-700 truncate">Planned: {plannedOutfitAlert.outfitName}</p>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{plannedOutfitAlert.message}</p>
          </div>
          <button onClick={() => setPlannedOutfitAlert(null)} className="text-stone-400 hover:text-stone-600 flex-shrink-0 text-xs">✕</button>
        </div>
      )}

      {/* Today's Outfits */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Today&apos;s Outfits</h2>
        <button
          onClick={generateOutfits}
          disabled={generating || !items.length}
          className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full transition-all disabled:opacity-50 hover:opacity-80"
          style={{ background: '#AA8EA0', color: 'white' }}
        >
          {generating ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {generating ? 'Generating…' : outfits.length ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {outfits.length > 0 ? (
        <div className="space-y-3 mb-6">
          {outfits.map((outfit, i) => (
            <OutfitCard key={i} outfit={outfit} wardrobeItems={items} isPro={isPro} hasProfilePhoto={hasProfilePhoto} />
          ))}
        </div>
      ) : !generating ? (
        <div
          className="rounded-2xl p-6 text-center mb-6 border border-dashed border-stone-200"
          style={{ background: 'rgba(255,255,255,0.6)' }}
        >
          <Sparkles size={28} className="mx-auto mb-2" style={{ color: '#AA8EA0' }} />
          <p className="text-sm text-stone-500">
            {items.length ? 'Tap Generate to get today\'s outfit picks' : 'Add wardrobe items to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/60 animate-pulse border border-stone-100" />
          ))}
        </div>
      )}

      {/* Consider These Pieces */}
      {suggestedItems.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-stone-900 mb-3">
            Consider these today
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {suggestedItems.map((item) => {
              const bg = CATEGORY_COLORS[item.category] ?? '#F5EEF3'
              return (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-24 rounded-2xl overflow-hidden border border-stone-100 shadow-sm"
                  style={{ background: 'rgba(255,255,255,0.9)' }}
                >
                  {item.thumbnail_url || item.image_url ? (
                    <img
                      src={item.thumbnail_url ?? item.image_url!}
                      alt={item.name}
                      className="w-24 h-24 object-cover"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 flex items-center justify-center"
                      style={{ background: bg }}
                    >
                      <span className="font-serif text-lg font-bold" style={{ color: '#725265', opacity: 0.4 }}>
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-stone-700 truncate leading-tight">{item.name}</p>
                    {item.color && <p className="text-xs text-stone-400 truncate">{item.color}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Stylist — only shown after outfits generated */}
      {outfits.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-stone-900 mb-3">AI Stylist</h2>

          {messages.length === 0 && !streaming && (
            <div className="flex flex-wrap gap-2 mb-3">
              {REFINE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-stone-200 text-stone-600 bg-white/80 hover:border-stone-300 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {(messages.length > 0 || streaming) && (
            <div className="space-y-3 mb-3 max-h-64 overflow-y-auto no-scrollbar">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-white rounded-br-sm'
                        : 'bg-white/90 border border-stone-100 text-stone-700 rounded-bl-sm'
                    }`}
                    style={msg.role === 'user' ? { background: '#AA8EA0' } : {}}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {streaming && streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-white/90 border border-stone-100 text-stone-700">
                    <span className="streaming-cursor">{streamingText}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask your stylist anything…"
              className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors bg-white/90"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="p-3 rounded-full text-white transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: '#AA8EA0' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type VizState = 'idle' | 'loading' | 'done' | 'error'

function OutfitCard({
  outfit,
  wardrobeItems,
  isPro,
  hasProfilePhoto,
}: {
  outfit: AIOutfitSuggestion
  wardrobeItems: ClothingItem[]
  isPro: boolean
  hasProfilePhoto: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vizState, setVizState] = useState<VizState>('idle')
  const [vizImageUrl, setVizImageUrl] = useState<string | null>(null)
  const [vizError, setVizError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const OCCASION_COLORS: Record<string, string> = {
    work: '#E5EDF5',
    casual: '#EBF3EC',
    formal: '#EDE8F5',
    evening: '#251828',
    sporty: '#E5F5EE',
    'smart casual': '#F5EEE8',
  }
  const oKey = outfit.occasion?.toLowerCase() ?? ''
  const bgColor = Object.entries(OCCASION_COLORS).find(([k]) => oKey.includes(k))?.[1] ?? '#F5EEF3'
  const textDark = bgColor === '#251828'

  // Check if any outfit item has a wardrobe photo (try-on requires garment image)
  const hasGarmentPhoto = outfit.items.some((name) =>
    wardrobeItems.some(
      (wi) =>
        (wi.thumbnail_url || wi.image_url) &&
        ['tops', 'bottoms', 'dresses', 'outerwear'].includes(wi.category) &&
        (wi.name.toLowerCase() === name.toLowerCase() ||
          wi.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(wi.name.toLowerCase()))
    )
  )

  async function saveOutfit(e: React.MouseEvent) {
    e.stopPropagation()
    if (saved || saving) return
    setSaving(true)
    try {
      await fetch('/api/outfits/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfit, items: wardrobeItems }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function startVisualization(e: React.MouseEvent) {
    e.stopPropagation()
    if (vizState === 'loading') return
    setVizState('loading')
    setVizError('')
    setVizImageUrl(null)
    if (!expanded) setExpanded(true)

    const res = await fetch('/api/outfits/visualize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitItemNames: outfit.items, wardrobeItems }),
    })
    const data = await res.json()

    if (!res.ok) {
      setVizState('error')
      setVizError(data.error ?? 'Visualization failed')
      return
    }

    const { predictionId } = data
    pollRef.current = setInterval(async () => {
      const pollRes = await fetch(`/api/outfits/visualize?id=${predictionId}`)
      const pollData = await pollRes.json()
      if (pollData.status === 'succeeded') {
        clearInterval(pollRef.current!)
        setVizImageUrl(pollData.imageUrl)
        setVizState('done')
      } else if (pollData.status === 'failed') {
        clearInterval(pollRef.current!)
        setVizState('error')
        setVizError(pollData.error ?? 'Generation failed')
      }
    }, 3000)
  }

  // Clean up polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const canTryOn = isPro && hasProfilePhoto && hasGarmentPhoto

  return (
    <div
      className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.92)' }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-stone-900 text-base leading-snug truncate">{outfit.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: bgColor, color: textDark ? '#F8F5F7' : '#4a3545' }}
            >
              {outfit.occasion}
            </span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{ background: '#F5EEF3', color: '#725265' }}
            >
              {outfit.style_tag}
            </span>
          </div>
        </div>

        {/* Try on button — Pro or locked */}
        {isPro ? (
          canTryOn && (
            <button
              onClick={startVisualization}
              disabled={vizState === 'loading'}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: '#EDE8F5', color: '#725265' }}
              title="Try on this outfit"
            >
              <Wand2 size={12} className={vizState === 'loading' ? 'animate-pulse' : ''} />
              {vizState === 'loading' ? 'Generating…' : 'Try on'}
            </button>
          )
        ) : (
          <button
            disabled
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full opacity-40 cursor-not-allowed"
            style={{ background: '#EDE8F5', color: '#725265' }}
            title="Upgrade to Pro to try on outfits"
          >
            <Lock size={12} />
            Try on
          </button>
        )}

        <button
          onClick={saveOutfit}
          disabled={saving}
          className="flex-shrink-0 p-1.5 rounded-full transition-colors hover:bg-stone-50"
          title={saved ? 'Saved' : 'Save outfit'}
        >
          {saved ? (
            <BookmarkCheck size={17} style={{ color: '#AA8EA0' }} />
          ) : (
            <Bookmark size={17} className={saving ? 'animate-pulse text-stone-300' : 'text-stone-300'} />
          )}
        </button>
        <ChevronRight
          size={16}
          className="text-stone-300 flex-shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-stone-50">
          <ul className="space-y-1 mb-3">
            {outfit.items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#AA8EA0' }} />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-400 italic leading-relaxed">{outfit.reason}</p>

          {/* Visualization result */}
          {vizState === 'loading' && (
            <div
              className="mt-3 rounded-xl h-48 flex flex-col items-center justify-center gap-2 border border-dashed border-stone-200"
              style={{ background: '#FAFAF8' }}
            >
              <Wand2 size={22} className="animate-pulse" style={{ color: '#AA8EA0' }} />
              <p className="text-xs text-stone-400">Generating try-on… ~30 sec</p>
            </div>
          )}
          {vizState === 'done' && vizImageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-stone-100">
              <img src={vizImageUrl} alt="Outfit try-on" className="w-full object-cover" />
              <p className="text-xs text-stone-400 text-center py-1.5">AI-generated try-on</p>
            </div>
          )}
          {vizState === 'error' && (
            <p className="mt-3 text-xs text-red-400 bg-red-50 px-3 py-2 rounded-xl">{vizError}</p>
          )}

          {/* Nudge for pro users missing a profile photo */}
          {isPro && !hasProfilePhoto && hasGarmentPhoto && (
            <p className="mt-3 text-xs text-stone-400 bg-stone-50 px-3 py-2 rounded-xl">
              Upload a profile photo to try on outfits →{' '}
              <a href="/profile" className="underline" style={{ color: '#AA8EA0' }}>Profile</a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
