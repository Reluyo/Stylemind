'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Search, Plus, Shirt, Bookmark, Trash2 } from 'lucide-react'
import type { ClothingItem, ClothingCategory, Outfit } from '@/lib/types'
import AddItemModal from '@/components/AddItemModal'

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
  tops: '#EDE8F5',
  bottoms: '#EBF3EC',
  dresses: '#F5E8F0',
  shoes: '#F0EDE8',
  accessories: '#E8EFF5',
  outerwear: '#F0EBF2',
}

type Tab = 'items' | 'outfits'

export default function WardrobePage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [items, setItems] = useState<ClothingItem[]>([])
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ClothingCategory | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [tab, setTab] = useState<Tab>('items')

  async function loadItems() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const [{ data: clothing }, { data: outfits }] = await Promise.all([
      supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('outfits')
        .select('*, outfit_items(clothing_items(name, category))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    setItems(clothing ?? [])
    setSavedOutfits(outfits ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const filtered = items.filter((item) => {
    const matchCat = category === 'all' || item.category === category
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.color?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  async function deleteItem(id: string) {
    const supabase = createClient()
    await supabase.from('clothing_items').delete().eq('id', id)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  async function deleteOutfit(id: string) {
    const supabase = createClient()
    await supabase.from('outfits').delete().eq('id', id)
    setSavedOutfits((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <div className="flex flex-col px-4 pt-6" style={{ height: 'calc(100vh - 5rem)' }}>

      {/* ── Fixed header ── */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Wardrobe</h1>
            <p className="text-xs text-stone-400 mt-0.5">{items.length} items · {savedOutfits.length} outfits</p>
          </div>
          {tab === 'items' && (
            <button
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full text-white hover:opacity-80 transition-all"
              style={{ background: '#AA8EA0' }}
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} />
              Add item
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: '#F5EEF3' }}>
          {(['items', 'outfits'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
              }`}
            >
              {t === 'items' ? `Clothes (${items.length})` : `Outfits (${savedOutfits.length})`}
            </button>
          ))}
        </div>

        {tab === 'items' && (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, color, tag…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors bg-white"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3">
              {CATEGORIES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === value
                      ? 'text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                  style={category === value ? { background: '#AA8EA0' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {tab === 'items' && (
          <>
            {loading && (
              <div className="grid grid-cols-2 gap-3 pt-1">
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
              <div className="grid grid-cols-2 gap-3 pt-1 pb-4">
                {filtered.map((item) => (
                  <ClothingCard key={item.id} item={item} onDelete={deleteItem} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'outfits' && (
          <div className="space-y-3 pb-4">
          {loading && [...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-stone-100 animate-pulse" />
          ))}

          {!loading && savedOutfits.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No saved outfits yet.</p>
              <p className="text-xs mt-1">Save outfits from the Today tab.</p>
            </div>
          )}

          {!loading && savedOutfits.map((outfit) => (
            <SavedOutfitCard key={outfit.id} outfit={outfit} onDelete={deleteOutfit} />
          ))}
        </div>
      )}

      </div>{/* end scrollable */}

      {showAddModal && userId && (
        <AddItemModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false)
            setLoading(true)
            loadItems()
          }}
        />
      )}
    </div>
  )
}

function ClothingCard({ item, onDelete }: { item: ClothingItem; onDelete: (id: string) => void }) {
  const bg = CATEGORY_COLORS[item.category] ?? '#F5EEF3'
  const initials = item.name.slice(0, 2).toUpperCase()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm bg-white relative group">
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
          <span className="font-serif text-2xl font-bold" style={{ color: '#725265', opacity: 0.4 }}>
            {initials}
          </span>
        </div>
      )}
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-stone-800 leading-snug truncate">{item.name}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            {item.color && (
              <span className="text-xs text-stone-400">{item.color}</span>
            )}
            {item.color && <span className="text-stone-200 text-xs">·</span>}
            <span
              className="text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: bg, color: '#4a3545' }}
            >
              {item.category}
            </span>
          </div>
          {confirming ? (
            <button
              className="text-xs text-red-500 font-medium"
              onClick={() => onDelete(item.id)}
            >
              Delete
            </button>
          ) : (
            <button
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-stone-50 transition-all"
              onClick={() => setConfirming(true)}
            >
              <Trash2 size={12} className="text-stone-300 hover:text-red-400 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SavedOutfitCard({ outfit, onDelete }: { outfit: Outfit & { outfit_items?: { clothing_items: { name: string; category: string } | null }[] }; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const itemNames = outfit.outfit_items
    ?.map((oi) => oi.clothing_items?.name)
    .filter(Boolean) as string[] | undefined

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 flex items-center gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
          style={{ background: '#F5EEF3' }}
        >
          <Bookmark size={16} style={{ color: '#AA8EA0' }} />
        </button>
        <div className="flex-1 min-w-0" onClick={() => itemNames?.length && setExpanded((v) => !v)}>
          <p className="text-sm font-semibold text-stone-800 truncate">{outfit.name}</p>
          <p className="text-xs text-stone-400 mt-0.5 truncate">
            {outfit.occasion ?? 'No occasion'} · {new Date(outfit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {itemNames?.length ? ` · ${itemNames.length} items` : ''}
          </p>
        </div>
        {confirming ? (
          <button
            className="text-xs text-red-500 font-medium flex-shrink-0"
            onClick={() => onDelete(outfit.id)}
          >
            Delete
          </button>
        ) : (
          <button
            className="p-1.5 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0"
            onClick={() => setConfirming(true)}
          >
            <Trash2 size={14} className="text-stone-300 hover:text-red-400 transition-colors" />
          </button>
        )}
      </div>

      {expanded && itemNames && itemNames.length > 0 && (
        <div className="px-4 pb-3 pt-0 border-t border-stone-50">
          <div className="flex flex-wrap gap-1.5 pt-2.5">
            {itemNames.map((name, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: '#F5EEF3', color: '#725265' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
