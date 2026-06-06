'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sparkles, Calendar, RotateCcw } from 'lucide-react'
import { DressFormIcon } from '@/components/BottomNav'
import type { ClothingItem } from '@/lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function getWeekDates(): Date[] {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  return DAYS.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getWeekKey(): string {
  const d = getWeekDates()[0]
  return `${d.getFullYear()}-W${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PlannerPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [items, setItems] = useState<ClothingItem[]>([])
  const [plan, setPlan] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [parsedPlan, setParsedPlan] = useState<Record<string, string>>({})
  const weekDates = getWeekDates()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('clothing_items').select('*').eq('user_id', user.id)
      setItems(data ?? [])

      // Restore cached plan for this week
      const cached = localStorage.getItem(`stylemind_weekplan_${user.id}_${getWeekKey()}`)
      if (cached) setPlan(cached)
    }
    load()
  }, [router])

  useEffect(() => {
    if (!plan) return
    const result: Record<string, string> = {}
    const dayPatterns = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const lines = plan.split('\n').filter((l) => l.trim())
    let currentDay = ''
    let currentText = ''

    for (const line of lines) {
      const dayMatch = dayPatterns.find((d) => line.toLowerCase().includes(d.toLowerCase()))
      if (dayMatch) {
        if (currentDay) result[currentDay] = currentText.trim()
        currentDay = dayMatch
        currentText = line.replace(/\*\*/g, '').replace(/^(mon|tue|wed|thu|fri)[^:]*:/i, '').trim()
      } else if (currentDay) {
        currentText += ' ' + line.replace(/\*\*/g, '').trim()
      }
    }
    if (currentDay) result[currentDay] = currentText.trim()
    setParsedPlan(result)
  }, [plan])

  async function generatePlan() {
    if (!items.length) return
    setGenerating(true)
    setPlan('')
    setParsedPlan({})

    const today = new Date()
    const weekStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const weekContext = `Week of ${weekStr}. Plan for Mon–Fri work week.`

    const res = await fetch('/api/planner/week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, weekContext }),
    })
    const data = await res.json()
    const newPlan = data.plan ?? ''
    setPlan(newPlan)
    if (newPlan && userId) {
      localStorage.setItem(`stylemind_weekplan_${userId}_${getWeekKey()}`, newPlan)
    }
    setGenerating(false)
  }

  function clearPlan() {
    setPlan('')
    setParsedPlan({})
    if (userId) localStorage.removeItem(`stylemind_weekplan_${userId}_${getWeekKey()}`)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
              <DressFormIcon size={26} color="#AA8EA0" strokeWidth={7} />
              <h1 className="font-serif text-2xl font-bold text-stone-900">Week Planner</h1>
            </div>
          <p className="text-xs text-stone-400 mt-0.5">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekDates[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {plan && !generating && (
            <button
              onClick={clearPlan}
              className="p-2 rounded-full text-stone-400 hover:bg-stone-100 transition-all"
              title="Clear plan"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            onClick={generatePlan}
            disabled={generating || !items.length}
            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full text-white hover:opacity-80 transition-all disabled:opacity-50"
            style={{ background: '#AA8EA0' }}
          >
            <Sparkles size={14} />
            {generating ? 'Planning…' : plan ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {!items.length && (
        <div className="text-center py-10 text-stone-400 text-sm">
          <p>Add wardrobe items first to generate a plan.</p>
        </div>
      )}

      {/* Day cards */}
      <div className="space-y-3">
        {DAYS.map((day, i) => {
          const date = weekDates[i]
          const dateNorm = new Date(date); dateNorm.setHours(0, 0, 0, 0)
          const isToday = dateNorm.getTime() === today.getTime()
          const isPast = dateNorm < today
          const dayPlan = parsedPlan[day]

          return (
            <div
              key={day}
              className={`rounded-2xl border overflow-hidden ${
                isToday ? 'border-[#AA8EA0]' : 'border-stone-100'
              } ${isPast ? 'opacity-60' : ''}`}
            >
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: isToday ? '#F5EEF3' : 'white' }}
              >
                <div className="flex-shrink-0 text-center w-10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{day}</p>
                  <p
                    className={`text-lg font-bold leading-none mt-0.5 ${isToday ? '' : 'text-stone-700'}`}
                    style={isToday ? { color: '#AA8EA0' } : {}}
                  >
                    {date.getDate()}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  {generating ? (
                    <div className="h-4 rounded bg-stone-100 animate-pulse w-3/4" />
                  ) : dayPlan ? (
                    <p className="text-sm text-stone-700 leading-snug line-clamp-2">{dayPlan}</p>
                  ) : (
                    <p className="text-sm text-stone-300 italic">
                      {plan ? 'No outfit planned' : 'Tap Generate to plan this day'}
                    </p>
                  )}
                </div>

                {isToday && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ background: '#AA8EA0' }}
                  >
                    TODAY
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!plan && !generating && items.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-200 p-6 text-center">
          <Calendar size={28} className="mx-auto mb-2 text-stone-300" />
          <p className="text-sm text-stone-400">
            Tap <strong style={{ color: '#AA8EA0' }}>Generate</strong> to plan your full work week
          </p>
        </div>
      )}
    </div>
  )
}
