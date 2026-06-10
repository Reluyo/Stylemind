'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Upload, Sparkles, Loader2 } from 'lucide-react'
import type { ClothingCategory, ClothingItem } from '@/lib/types'

const CATEGORIES: { label: string; value: ClothingCategory }[] = [
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Outerwear', value: 'outerwear' },
]

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']

interface Props {
  item: ClothingItem
  onClose: () => void
  onSaved: (updated: ClothingItem) => void
}

export default function EditItemModal({ item, onClose, onSaved }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item.thumbnail_url ?? item.image_url ?? null)
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState<ClothingCategory>(item.category)
  const [color, setColor] = useState(item.color ?? '')
  const [brand, setBrand] = useState(item.brand ?? '')
  const [seasons, setSeasons] = useState<string[]>(item.season)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image is too large — max 5 MB.'); return }
    setError('')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function analyzeWithAI() {
    if (!imageFile) return
    setAnalyzing(true)
    setError('')
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(imageFile)
      })
      const res = await fetch('/api/wardrobe/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: imageFile.type }),
      })
      if (!res.ok) { const { error: e } = await res.json(); setError(e ?? 'AI analysis failed'); return }
      const data = await res.json()
      if (data.name) setName(data.name)
      if (data.category) setCategory(data.category as ClothingCategory)
      if (data.color) setColor(data.color)
      if (data.brand) setBrand(data.brand)
    } catch {
      setError('Could not analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      let imageUrl = item.image_url
      let thumbnailUrl = item.thumbnail_url

      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg'
        const path = `${item.user_id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('wardrobe-images')
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false })
        if (uploadError) { setError('Image upload failed: ' + uploadError.message); setSaving(false); return }
        const { data: { publicUrl } } = supabase.storage.from('wardrobe-images').getPublicUrl(path)
        imageUrl = publicUrl
        thumbnailUrl = publicUrl
      }

      const updates = {
        name: name.trim(),
        category,
        color: color.trim() || null,
        brand: brand.trim() || null,
        season: seasons,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
      }

      const { error: updateError } = await supabase
        .from('clothing_items')
        .update(updates)
        .eq('id', item.id)

      if (updateError) { setError('Failed to save: ' + updateError.message); setSaving(false); return }
      onSaved({ ...item, ...updates })
    } catch {
      setError('Something went wrong')
      setSaving(false)
    }
  }

  function toggleSeason(s: string) {
    setSeasons((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[430px] bg-white rounded-t-3xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>
        <div className="px-5 pb-16 pt-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl font-bold text-stone-900">Edit item</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 transition-colors">
              <X size={18} className="text-stone-500" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Photo</label>
              <p className="text-xs text-stone-400 mb-2 leading-relaxed">
                A clean, flat photo of just this item gives the best AI try-on results.
              </p>
              <div
                className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
                  dragging ? 'border-[#AA8EA0] bg-[#FAF6F9]' : 'border-stone-200 bg-stone-50'
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-2xl" />
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-md hover:bg-stone-50"
                      onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    >
                      <X size={14} className="text-stone-500" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Upload size={24} className="text-stone-300" />
                    <p className="text-sm text-stone-400">Tap to replace photo</p>
                  </div>
                )}
              </div>
              {imageFile && (
                <button
                  type="button"
                  onClick={analyzeWithAI}
                  disabled={analyzing}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: '#F5EEF3', color: '#725265' }}
                >
                  {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {analyzing ? 'Analyzing…' : 'Auto-fill with AI'}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Navy Slim-Fit Chinos"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Category <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${
                      category === value ? 'text-white' : 'bg-stone-50 border border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                    style={category === value ? { background: '#AA8EA0' } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Color</label>
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Navy blue"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Brand</label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Season</label>
              <div className="flex gap-2">
                {SEASONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSeason(s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                      seasons.includes(s) ? 'text-white' : 'bg-stone-50 border border-stone-200 text-stone-600'
                    }`}
                    style={seasons.includes(s) ? { background: '#AA8EA0' } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-1"
              style={{ background: '#AA8EA0' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
