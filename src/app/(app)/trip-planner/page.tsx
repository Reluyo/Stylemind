'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sparkles, Luggage, ChevronRight, Package, Minus, Plus } from 'lucide-react'
import type { ClothingItem } from '@/lib/types'

interface TripDay {
  day: number
  outfit_name: string
  occasion: string
  items: string[]
  notes: string
}

const OCCASIONS = [
  { value: 'mixed casual and smart casual', label: 'Mixed (casual + smart)' },
  { value: 'casual', label: 'Casual' },
  { value: 'business and work meetings', label: 'Business / Work' },
  { value: 'formal events and evenings out', label: 'Formal / Events' },
]

export default function TripPlannerPage() {
  const router = useRouter()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [days, setDays] = useState(5)
  const [destination, setDestination] = useState('')
  const [occasion, setOccasion] = useState(OCCASIONS[0].value)
  const [plan, setPlan] = useState<TripDay[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'plan' | 'packing'>('plan')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('clothing_items').select('*').eq('user_id', user.id)
      setItems(data ?? [])
    }
    load()
  }, [router])

  async function generate() {
    if (!items.length) { setError('Add wardrobe items first.'); return }
    setGenerating(true)
    setError('')
    setPlan([])
    try {
      const res = await fetch('/api/planner/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, days, occasion, destination: destination.trim() || undefined }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setPlan(data.plan ?? [])
      setActiveTab('plan')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Build packing list: all unique items across all days
  const packingList = Array.from(
    new Set(plan.flatMap((d) => d.items))
  ).sort()

  return (
    <div className="px-4 pt-6 pb-6">
      {/* Header */}
      <div className="mb-5 pr-10">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Trip Planner</h1>
        <p className="text-xs text-stone-400 mt-0.5">Pack smart, dress well</p>
      </div>

      {/* Config card */}
      <div
        className="rounded-2xl p-5 mb-5 border border-stone-100"
        style={{ background: 'rgba(255,255,255,0.9)' }}
      >
        {/* Days */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
            Number of days
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDays((d) => Math.max(1, d - 1))}
              className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
            >
              <Minus size={14} className="text-stone-600" />
            </button>
            <span className="font-serif text-3xl font-bold text-stone-900 w-8 text-center">{days}</span>
            <button
              onClick={() => setDays((d) => Math.min(14, d + 1))}
              className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
            >
              <Plus size={14} className="text-stone-600" />
            </button>
            <span className="text-sm text-stone-400">{days === 1 ? 'day' : 'days'}</span>
          </div>
        </div>

        {/* Destination */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
            Destination (optional)
          </label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Paris, beach resort, NYC..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors bg-white"
          />
        </div>

        {/* Occasion */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
            Trip vibe
          </label>
          <div className="grid grid-cols-2 gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setOccasion(o.value)}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-left transition-all ${
                  occasion === o.value
                    ? 'text-white'
                    : 'bg-stone-50 border border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
                style={occasion === o.value ? { background: '#AA8EA0' } : {}}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl mb-4">{error}</p>
        )}

        <button
          onClick={generate}
          disabled={generating || !items.length}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: '#AA8EA0' }}
        >
          {generating ? (
            <Sparkles size={16} className="animate-pulse" />
          ) : (
            <Luggage size={16} />
          )}
          {generating ? 'Planning your trip…' : plan.length ? 'Regenerate plan' : 'Generate trip plan'}
        </button>
      </div>

      {/* Results */}
      {plan.length > 0 && (
        <>
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: '#F5EEF3' }}>
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'plan' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
              }`}
            >
              Day-by-day ({plan.length})
            </button>
            <button
              onClick={() => setActiveTab('packing')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'packing' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
              }`}
            >
              Packing list ({packingList.length})
            </button>
          </div>

          {activeTab === 'plan' && (
            <div className="space-y-3">
              {plan.map((tripDay) => (
                <TripDayCard key={tripDay.day} tripDay={tripDay} />
              ))}
            </div>
          )}

          {activeTab === 'packing' && (
            <div
              className="rounded-2xl p-5 border border-stone-100"
              style={{ background: 'rgba(255,255,255,0.9)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} style={{ color: '#AA8EA0' }} />
                <h3 className="font-serif text-base font-semibold text-stone-900">
                  Your packing list
                </h3>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                {packingList.length} unique items for {days} {days === 1 ? 'day' : 'days'}
              </p>
              <ul className="space-y-2">
                {packingList.map((item, i) => (
                  <PackingItem key={i} name={item} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {generating && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/60 animate-pulse border border-stone-100" />
          ))}
        </div>
      )}

      {!plan.length && !generating && (
        <div
          className="rounded-2xl p-8 text-center border border-dashed border-stone-200"
          style={{ background: 'rgba(255,255,255,0.5)' }}
        >
          <Luggage size={32} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm text-stone-400">
            Configure your trip above and tap <strong style={{ color: '#AA8EA0' }}>Generate</strong>
          </p>
        </div>
      )}
    </div>
  )
}

function TripDayCard({ tripDay }: { tripDay: TripDay }) {
  const [expanded, setExpanded] = useState(false)

  const OCCASION_COLORS: Record<string, string> = {
    work: '#E5EDF5',
    business: '#E5EDF5',
    casual: '#EBF3EC',
    formal: '#EDE8F5',
    evening: '#F5EEF3',
    sporty: '#E5F5EE',
    mixed: '#F5EEE8',
  }
  const oKey = tripDay.occasion?.toLowerCase() ?? ''
  const bgColor = Object.entries(OCCASION_COLORS).find(([k]) => oKey.includes(k))?.[1] ?? '#F5EEF3'

  return (
    <div
      className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.92)' }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-serif font-bold text-sm"
          style={{ background: '#F5EEF3', color: '#AA8EA0' }}
        >
          D{tripDay.day}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-stone-900 text-sm leading-snug truncate">
            {tripDay.outfit_name}
          </h3>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block"
            style={{ background: bgColor, color: '#4a3545' }}
          >
            {tripDay.occasion}
          </span>
        </div>
        <ChevronRight
          size={16}
          className="text-stone-300 flex-shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-stone-50">
          <ul className="space-y-1 mb-2">
            {tripDay.items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#AA8EA0' }} />
                {item}
              </li>
            ))}
          </ul>
          {tripDay.notes && (
            <p className="text-xs text-stone-400 italic leading-relaxed mt-2">{tripDay.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}

function PackingItem({ name }: { name: string }) {
  const [checked, setChecked] = useState(false)

  return (
    <li
      className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0 cursor-pointer"
      onClick={() => setChecked((v) => !v)}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked ? 'border-transparent' : 'border-stone-200'
        }`}
        style={checked ? { background: '#AA8EA0' } : {}}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`text-sm transition-all ${checked ? 'line-through text-stone-300' : 'text-stone-700'}`}>
        {name}
      </span>
    </li>
  )
}
