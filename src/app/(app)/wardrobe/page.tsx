'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Search, Plus, Shirt } from 'lucide-react'
import type { ClothingItem, ClothingCategory } from '@/lib/types'

const CATEGORIES: { label: string; value: ClothingCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Outerwear', value: 'outerwear' },
]

const CATEGORY_COLORS: Record<ClothingCategory, string> = {
  tops: '#E8F0F8',
  bottoms: '#EAF3EC',
  dresses: '#F8EAF0',
  shoes: '#F3F0E8',
  accessories: '#EDE8F8',
  outerwear: '#F0EBE8',
}

export default function WardrobePage() {
  const router = useRouter()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ClothingCategory | 'all'>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = items.filter((item) => {
    const matchCat = category === 'all' || item.category === category
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.color?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Wardrobe</h1>
          <p className="text-xs text-stone-400 mt-0.5">{items.length} items</p>
        </div>
        <button
          className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full text-white hover:opacity-80 transition-all"
          style={{ background: '#C8956C' }}
          onClick={() => alert('Upload coming soon — add photos of your clothes here.')}
        >
          <Plus size={14} />
          Add item
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, color, tag…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#C8956C] transition-colors bg-white"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
        {CATEGORIES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === value
                ? 'text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
            style={category === value ? { background: '#C8956C' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-stone-100 animate-pulse h-40" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <Shirt size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {search || category !== 'all' ? 'No items match your filter.' : 'Your wardrobe is empty.'}
          </p>
          {!search && category === 'all' && (
            <p className="text-xs mt-1">Tap <strong>Add item</strong> to get started.</p>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filtered.map((item) => (
            <ClothingCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClothingCard({ item }: { item: ClothingItem }) {
  const bg = CATEGORY_COLORS[item.category] ?? '#F5EDE6'
  const initials = item.name.slice(0, 2).toUpperCase()

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm bg-white">
      {item.thumbnail_url || item.image_url ? (
        <img
          src={item.thumbnail_url ?? item.image_url!}
          alt={item.name}
          className="w-full h-32 object-cover"
        />
      ) : (
        <div
          className="w-full h-32 flex items-center justify-center"
          style={{ background: bg }}
        >
          <span className="font-serif text-2xl font-bold" style={{ color: '#8B5E3C', opacity: 0.4 }}>
            {initials}
          </span>
        </div>
      )}
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-stone-800 leading-snug truncate">{item.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {item.color && (
            <span className="text-xs text-stone-400">{item.color}</span>
          )}
          {item.color && <span className="text-stone-200 text-xs">·</span>}
          <span
            className="text-xs px-2 py-0.5 rounded-full capitalize"
            style={{ background: bg, color: '#5a3e2b' }}
          >
            {item.category}
          </span>
        </div>
      </div>
    </div>
  )
}
