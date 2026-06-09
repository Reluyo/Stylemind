'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, Shirt, Bookmark, Trash2, Heart, Share2, BarChart2, Pencil, Sparkles, X } from 'lucide-react'
import type { ClothingItem, ClothingCategory, Outfit } from '@/lib/types'
import { FREE_ITEM_LIMIT } from '@/lib/plan'
import AddItemModal from '@/components/AddItemModal'
import EditItemModal from '@/components/EditItemModal'
import ShareOutfitModal from '@/components/ShareOutfitModal'
import WardrobeFooterAd from '@/components/ads/WardrobeFooterAd'

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

type Tab = 'items' | 'outfits' | 'stats'
type OutfitWithItems = Outfit & { outfit_items?: { clothing_items: { name: string; category: string } | null }[] }

export default function WardrobePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState('')
  const [items, setItems] = useState<ClothingItem[]>([])
  const [savedOutfits, setSavedOutfits] = useState<OutfitWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(true) // default true to avoid flash of ads on load
  const [search, setSearch] = useState('')
  const [outfitSearch, setOutfitSearch] = useState('')
  const [category, setCategory] = useState<ClothingCategory | 'all'>('all')
  const [showFavsOnly, setShowFavsOnly] = useState(false)
  const [showFavOutfitsOnly, setShowFavOutfitsOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [limitHit, setLimitHit] = useState(false)
  const [tab, setTab] = useState<Tab>('items')

  const atItemLimit = !isPro && items.length >= FREE_ITEM_LIMIT

  function openAdd() {
    if (atItemLimit) { setLimitHit(true); return }
    setShowAddModal(true)
  }

  async function loadItems() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const [{ data: clothing }, { data: outfits }, { data: profile }] = await Promise.all([
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
      supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single(),
    ])

    setItems(clothing ?? [])
    setSavedOutfits(outfits ?? [])
    setIsPro(profile?.plan === 'pro')
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Deep link from onboarding / Today empty-state: open the add sheet once
  // the wardrobe has loaded, then strip the query param.
  useEffect(() => {
    if (loading) return
    if (searchParams.get('add') === '1') {
      if (!isPro && items.length >= FREE_ITEM_LIMIT) setLimitHit(true)
      else setShowAddModal(true)
      router.replace('/wardrobe')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const filtered = items.filter((item) => {
    const matchCat = category === 'all' || item.category === category
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.color?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchFav = !showFavsOnly || item.is_favorite
    return matchCat && matchSearch && matchFav
  })

  const filteredOutfits = savedOutfits.filter((o) => {
    const matchSearch = !outfitSearch ||
      o.name.toLowerCase().includes(outfitSearch.toLowerCase()) ||
      (o.occasion ?? '').toLowerCase().includes(outfitSearch.toLowerCase())
    const matchFav = !showFavOutfitsOnly || o.is_favorite
    return matchSearch && matchFav
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

  function updateItemFav(id: string, val: boolean) {
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, is_favorite: val } : x))
  }

  function updateItem(updated: ClothingItem) {
    setItems((prev) => prev.map((x) => x.id === updated.id ? updated : x))
  }

  function updateOutfitFav(id: string, val: boolean) {
    setSavedOutfits((prev) => prev.map((x) => x.id === id ? { ...x, is_favorite: val } : x))
  }

  const categoryBreakdown = CATEGORIES.slice(1).map(({ label, value }) => ({
    label,
    value: value as ClothingCategory,
    count: items.filter((i) => i.category === value).length,
    color: CATEGORY_COLORS[value as ClothingCategory],
  })).sort((a, b) => b.count - a.count)

  const maxCatCount = Math.max(1, ...categoryBreakdown.map((c) => c.count))

  const topWorn = [...items]
    .filter((i) => i.times_worn > 0)
    .sort((a, b) => b.times_worn - a.times_worn)
    .slice(0, 3)

  const neverWorn = items.filter((i) => i.times_worn === 0).length

  const seasonCounts = ['Spring', 'Summer', 'Fall', 'Winter'].map((s) => ({
    season: s,
    count: items.filter((i) => i.season.includes(s)).length,
  }))

  return (
    <div className="flex flex-col px-4 pt-6" style={{ height: 'calc(100vh - 5rem)' }}>

      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Wardrobe</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              {items.length} items · {savedOutfits.length} outfits
              {!isPro && <span className={atItemLimit ? 'text-red-400 font-medium' : ''}> · {items.length}/{FREE_ITEM_LIMIT}</span>}
            </p>
          </div>
          {tab === 'items' && (
            <button
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full text-white hover:opacity-80 transition-all"
              style={{ background: '#AA8EA0' }}
              onClick={openAdd}
            >
              <Plus size={14} />
              Add item
            </button>
          )}
        </div>

        <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: '#F5EEF3' }}>
          {(['items', 'outfits', 'stats'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
              }`}
            >
              {t === 'items' ? `Clothes (${items.length})` : t === 'outfits' ? `Outfits (${savedOutfits.length})` : 'Stats'}
            </button>
          ))}
        </div>

        {tab === 'items' && (
          <>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, color, tag…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors bg-white"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3">
              {CATEGORIES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === value ? 'text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                  style={category === value ? { background: '#AA8EA0' } : {}}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setShowFavsOnly((v) => !v)}
                className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  showFavsOnly ? 'text-white' : 'bg-white border border-stone-200 text-stone-600'
                }`}
                style={showFavsOnly ? { background: '#AA8EA0' } : {}}
              >
                <Heart size={11} />
                Favorites
              </button>
            </div>
          </>
        )}

        {tab === 'outfits' && (
          <div className="mb-3 space-y-2">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                value={outfitSearch}
                onChange={(e) => setOutfitSearch(e.target.value)}
                placeholder="Search outfits…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors bg-white"
              />
            </div>
            <button
              onClick={() => setShowFavOutfitsOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                showFavOutfitsOnly ? 'text-white' : 'bg-white border border-stone-200 text-stone-600'
              }`}
              style={showFavOutfitsOnly ? { background: '#AA8EA0' } : {}}
            >
              <Heart size={11} />
              Favorites only
            </button>
          </div>
        )}
      </div>

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
                  {search || category !== 'all' || showFavsOnly ? 'No items match your filter.' : 'Your wardrobe is empty.'}
                </p>
                {!search && category === 'all' && !showFavsOnly && (
                  <p className="text-xs mt-1">Tap <strong>Add item</strong> to get started.</p>
                )}
              </div>
            )}
            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-1 pb-4">
                {filtered.map((item) => (
                  <ClothingCard key={item.id} item={item} onDelete={deleteItem} onFavToggle={updateItemFav} onEdit={updateItem} />
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
            {!loading && filteredOutfits.length === 0 && (
              <div className="text-center py-16 text-stone-400">
                <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {outfitSearch || showFavOutfitsOnly ? 'No outfits match your filter.' : 'No saved outfits yet.'}
                </p>
                {!outfitSearch && !showFavOutfitsOnly && (
                  <p className="text-xs mt-1">Save outfits from the Today tab.</p>
                )}
              </div>
            )}
            {!loading && filteredOutfits.map((outfit) => (
              <SavedOutfitCard key={outfit.id} outfit={outfit} onDelete={deleteOutfit} onFavToggle={updateOutfitFav} />
            ))}
          </div>
        )}

        {tab === 'stats' && (
          <div className="pb-6 space-y-5">
            {loading ? (
              <div className="space-y-3 pt-1">
                {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-stone-100 animate-pulse" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Add items to see your stats.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">By category</p>
                  <div className="space-y-3">
                    {categoryBreakdown.filter((c) => c.count > 0).map((c) => (
                      <div key={c.value}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-stone-700 capitalize">{c.label}</span>
                          <span className="text-xs font-medium text-stone-500">{c.count}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${(c.count / maxCatCount) * 100}%`,
                              background: c.color === '#F5EEF3' ? '#AA8EA0' : c.color,
                              filter: 'saturate(1.4) brightness(0.85)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Seasonal coverage</p>
                  <div className="grid grid-cols-2 gap-3">
                    {seasonCounts.map(({ season, count }) => (
                      <div
                        key={season}
                        className="rounded-xl p-3 text-center"
                        style={{ background: count === 0 ? '#FEF2F2' : '#F5EEF3' }}
                      >
                        <p className="text-2xl font-bold font-serif" style={{ color: count === 0 ? '#EF4444' : '#AA8EA0' }}>{count}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{season}</p>
                        {count === 0 && <p className="text-xs text-red-400 mt-0.5">Gap!</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Wear history</p>
                  {topWorn.length > 0 && (
                    <>
                      <p className="text-xs text-stone-500 mb-3">Most worn</p>
                      <div className="space-y-2 mb-4">
                        {topWorn.map((item) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <span className="text-sm text-stone-700 truncate flex-1">{item.name}</span>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                              style={{ background: '#F5EEF3', color: '#725265' }}
                            >
                              {item.times_worn}×
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                    <span className="text-sm text-stone-500">Never worn</span>
                    <span className="text-sm font-semibold text-stone-700">{neverWorn} items</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Total items" value={items.length} />
                  <StatCard label="Outfits" value={savedOutfits.length} />
                  <StatCard label="Favorites" value={items.filter((i) => i.is_favorite).length} />
                </div>
              </>
            )}
          </div>
        )}

      </div>

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

      {limitHit && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setLimitHit(false) }}
        >
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl px-6 pt-3 pb-10">
            <div className="flex justify-center pb-3"><div className="w-10 h-1 rounded-full bg-stone-200" /></div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-xl font-bold text-stone-900">Wardrobe is full</h2>
              <button onClick={() => setLimitHit(false)} className="p-1.5 rounded-full hover:bg-stone-100">
                <X size={18} className="text-stone-500" />
              </button>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed mb-5">
              Free accounts hold up to {FREE_ITEM_LIMIT} items. Upgrade to Pro for an unlimited wardrobe,
              5 daily outfits, AI Stylist chat, and try-on.
            </p>
            <Link
              href="/profile"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90"
              style={{ background: '#AA8EA0' }}
            >
              <Sparkles size={15} /> Upgrade to Pro
            </Link>
          </div>
        </div>
      )}

      {!loading && !isPro && <WardrobeFooterAd />}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 px-3 py-4 text-center">
      <p className="text-2xl font-bold font-serif text-stone-900">{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{label}</p>
    </div>
  )
}

function ClothingCard({
  item,
  onDelete,
  onFavToggle,
  onEdit,
}: {
  item: ClothingItem
  onDelete: (id: string) => void
  onFavToggle: (id: string, val: boolean) => void
  onEdit: (updated: ClothingItem) => void
}) {
  const bg = CATEGORY_COLORS[item.category] ?? '#F5EEF3'
  const initials = item.name.slice(0, 2).toUpperCase()
  const [confirming, setConfirming] = useState(false)
  const [isFav, setIsFav] = useState(item.is_favorite)
  const [editing, setEditing] = useState(false)

  async function toggleFav(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !isFav
    setIsFav(next)
    onFavToggle(item.id, next)
    const supabase = createClient()
    await supabase.from('clothing_items').update({ is_favorite: next }).eq('id', item.id)
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm bg-white relative group">
        {item.thumbnail_url || item.image_url ? (
          <img src={item.thumbnail_url ?? item.image_url!} alt={item.name} className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-32 flex items-center justify-center" style={{ background: bg }}>
            <span className="font-serif text-2xl font-bold" style={{ color: '#725265', opacity: 0.4 }}>{initials}</span>
          </div>
        )}
        <button
          onClick={toggleFav}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{ background: isFav ? '#AA8EA0' : 'rgba(255,255,255,0.85)' }}
        >
          <Heart size={13} fill={isFav ? 'white' : 'none'} color={isFav ? 'white' : '#AA8EA0'} />
        </button>
        <div className="px-3 py-2.5">
          <p className="text-sm font-medium text-stone-800 leading-snug truncate">{item.name}</p>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5">
              {item.color && <span className="text-xs text-stone-400">{item.color}</span>}
              {item.color && <span className="text-stone-200 text-xs">·</span>}
              <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: bg, color: '#4a3545' }}>
                {item.category}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {confirming ? (
                <button className="text-xs text-red-500 font-medium" onClick={() => onDelete(item.id)}>Delete</button>
              ) : (
                <>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-stone-50 transition-all"
                    onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                  >
                    <Pencil size={12} className="text-stone-300 hover:text-stone-500 transition-colors" />
                  </button>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-stone-50 transition-all"
                    onClick={() => setConfirming(true)}
                  >
                    <Trash2 size={12} className="text-stone-300 hover:text-red-400 transition-colors" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {editing && (
        <EditItemModal
          item={item}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { onEdit(updated); setEditing(false) }}
        />
      )}
    </>
  )
}

function SavedOutfitCard({
  outfit,
  onDelete,
  onFavToggle,
}: {
  outfit: OutfitWithItems
  onDelete: (id: string) => void
  onFavToggle: (id: string, val: boolean) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isFav, setIsFav] = useState(outfit.is_favorite)
  const [sharing, setSharing] = useState(false)

  const itemNames = outfit.outfit_items
    ?.map((oi) => oi.clothing_items?.name)
    .filter(Boolean) as string[] | undefined

  async function toggleFav(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !isFav
    setIsFav(next)
    onFavToggle(outfit.id, next)
    const supabase = createClient()
    await supabase.from('outfits').update({ is_favorite: next }).eq('id', outfit.id)
  }

  return (
    <>
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

          <button onClick={toggleFav} className="p-1.5 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0">
            <Heart size={14} fill={isFav ? '#AA8EA0' : 'none'} color={isFav ? '#AA8EA0' : '#d1cdd0'} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setSharing(true) }}
            className="p-1.5 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0"
          >
            <Share2 size={14} className="text-stone-300 hover:text-stone-500 transition-colors" />
          </button>

          {confirming ? (
            <button className="text-xs text-red-500 font-medium flex-shrink-0" onClick={() => onDelete(outfit.id)}>
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
                <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#F5EEF3', color: '#725265' }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {sharing && <ShareOutfitModal outfit={outfit} onClose={() => setSharing(false)} />}
    </>
  )
}
