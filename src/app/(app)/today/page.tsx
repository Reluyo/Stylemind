'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sparkles, Send, RefreshCw, CloudSun, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react'
import type { AIOutfitSuggestion, ClothingItem, WeatherSummary } from '@/lib/types'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

const REFINE_CHIPS = [
  'More casual',
  'More formal',
  'Something bolder',
  'Warmer layers',
  'Work-appropriate',
]

export default function TodayPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState<WeatherSummary | null>(null)
  const [items, setItems] = useState<ClothingItem[]>([])
  const [outfits, setOutfits] = useState<AIOutfitSuggestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('full_name, location').eq('id', user.id).single()
      const name = profile?.full_name?.split(' ')[0] ?? 'there'
      setUserName(name)
      const loc = profile?.location ?? 'New York'
      setLocation(loc)

      const { data: clothing } = await supabase.from('clothing_items').select('*').eq('user_id', user.id)
      setItems(clothing ?? [])

      const res = await fetch(`/api/weather?location=${encodeURIComponent(loc)}`)
      const w = await res.json()
      setWeather(w)
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
        body: JSON.stringify({ items, weather }),
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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="mb-5">
        <p className="text-stone-400 text-sm">{greeting}</p>
        <h1 className="font-serif text-2xl font-bold text-stone-900">{userName ? `${greeting}, ${userName}` : greeting}</h1>
      </div>

      {/* Weather bar */}
      {weather && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
          style={{ background: '#F5EEF3' }}
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

      {/* Outfits section */}
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

      {!items.length && (
        <div className="text-center py-10 text-stone-400 text-sm">
          <p>No wardrobe items yet.</p>
          <p className="mt-1">Head to <span className="font-medium" style={{ color: '#AA8EA0' }}>Wardrobe</span> to add some.</p>
        </div>
      )}

      {outfits.length > 0 && (
        <div className="space-y-3 mb-6">
          {outfits.map((outfit, i) => (
            <OutfitCard key={i} outfit={outfit} wardrobeItems={items} />
          ))}
        </div>
      )}

      {!outfits.length && items.length > 0 && !generating && (
        <div
          className="rounded-2xl p-6 text-center mb-6 border border-dashed border-stone-200"
        >
          <Sparkles size={28} className="mx-auto mb-2" style={{ color: '#AA8EA0' }} />
          <p className="text-sm text-stone-500">Tap <strong>Generate</strong> to get today&apos;s outfit picks</p>
        </div>
      )}

      {/* Stylist Chat */}
      <div className="mb-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900 mb-3">AI Stylist</h2>

        {messages.length === 0 && !streaming && (
          <div className="flex flex-wrap gap-2 mb-3">
            {REFINE_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-stone-200 text-stone-600 bg-white hover:border-stone-300 transition-all"
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
                      : 'bg-white border border-stone-100 text-stone-700 rounded-bl-sm'
                  }`}
                  style={msg.role === 'user' ? { background: '#AA8EA0' } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {streaming && streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-white border border-stone-100 text-stone-700">
                  <span className="streaming-cursor">{streamingText}</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask your stylist anything…"
            className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors bg-white"
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
    </div>
  )
}

function OutfitCard({ outfit, wardrobeItems }: { outfit: AIOutfitSuggestion; wardrobeItems: ClothingItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

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

  return (
    <div
      className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white">
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
        <div className="px-4 pb-4 pt-1 bg-white border-t border-stone-50">
          <ul className="space-y-1 mb-3">
            {outfit.items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#AA8EA0' }} />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-400 italic leading-relaxed">{outfit.reason}</p>
        </div>
      )}
    </div>
  )
}
