'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Upload, Sparkles, Loader2 } from 'lucide-react'
import type { ClothingCategory } from '@/lib/types'

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
  userId: string
  onClose: () => void
  onSaved: () => void
  // Called after a "Save & add another" — refresh data but keep the sheet open.
  onSavedContinue?: () => void
  // Pre-select a category (used by the onboarding quick-start slots).
  initialCategory?: ClothingCategory
}

export default function AddItemModal({ userId, onClose, onSaved, onSavedContinue, initialCategory }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ClothingCategory>(initialCategory ?? 'tops')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [seasons, setSeasons] = useState<string[]>([])
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
    // Auto-fill fields the moment a photo is added — no extra tap required.
    analyzeWithAI(file)
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

  async function analyzeWithAI(file?: File) {
    const target = file ?? imageFile
    if (!target) return
    setAnalyzing(true)
    setError('')
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          // strip the "data:image/xxx;base64," prefix
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(target)
      })

      const res = await fetch('/api/wardrobe/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: target.type,
        }),
      })

      if (!res.ok) {
        const { error: e } = await res.json()
        setError(e ?? 'AI analysis failed')
        return
      }

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

  function resetForm() {
    setImageFile(null)
    setImagePreview(null)
    setName('')
    setColor('')
    setBrand('')
    // Keep category + seasons — cataloging usually happens one category at a time.
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSave(e: React.FormEvent, keepOpen = false) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      let imageUrl: string | null = null
      let thumbnailUrl: string | null = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg'
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('wardrobe-images')
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false })

        if (uploadError) {
          setError('Image upload failed: ' + uploadError.message)
          setSaving(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('wardrobe-images')
          .getPublicUrl(path)

        imageUrl = publicUrl
        thumbnailUrl = publicUrl
      }

      const { error: insertError } = await supabase.from('clothing_items').insert({
        user_id: userId,
        name: name.trim(),
        category,
        color: color.trim() || null,
        brand: brand.trim() || null,
        season: seasons,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        tags: [],
      })

      if (insertError) {
        setError('Failed to save item: ' + insertError.message)
        setSaving(false)
        return
      }

      setSaving(false)
      if (keepOpen) {
        resetForm()
        onSavedContinue?.()
      } else {
        onSaved()
      }
    } catch {
      setError('Something went wrong')
      setSaving(false)
    }
  }

  function toggleSeason(s: string) {
    setSeasons((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[430px] bg-white rounded-t-3xl overflow-y-auto max-h-[90vh]">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        <div className="px-5 pb-16 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl font-bold text-stone-900">Add clothing item</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X size={18} className="text-stone-500" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Image upload */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                Photo (optional)
              </label>
              <div
                className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
                  dragging ? 'border-[#AA8EA0] bg-[#FAF6F9]' : 'border-stone-200 bg-stone-50'
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-2xl"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-md hover:bg-stone-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImageFile(null)
                        setImagePreview(null)
                        if (fileRef.current) fileRef.current.value = ''
                      }}
                    >
                      <X size={14} className="text-stone-500" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Upload size={24} className="text-stone-300" />
                    <p className="text-sm text-stone-400">Tap or drag a photo here</p>
                    <p className="text-xs text-stone-300">JPEG, PNG, WebP — max 5 MB</p>
                  </div>
                )}
              </div>

              {imageFile && (
                <button
                  type="button"
                  onClick={() => analyzeWithAI()}
                  disabled={analyzing}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: '#F5EEF3', color: '#725265' }}
                >
                  {analyzing ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Sparkles size={15} />
                  )}
                  {analyzing ? 'Analyzing your photo…' : 'Re-run AI auto-fill'}
                </button>
              )}
            </div>

            {/* Name */}
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

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${
                      category === value
                        ? 'text-white'
                        : 'bg-stone-50 border border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                    style={category === value ? { background: '#AA8EA0' } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color + Brand */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                  Color
                </label>
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Navy blue"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                  Brand
                </label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors"
                />
              </div>
            </div>

            {/* Season */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                Season
              </label>
              <div className="flex gap-2">
                {SEASONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSeason(s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                      seasons.includes(s)
                        ? 'text-white'
                        : 'bg-stone-50 border border-stone-200 text-stone-600'
                    }`}
                    style={seasons.includes(s) ? { background: '#AA8EA0' } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={(e) => handleSave(e, true)}
                disabled={saving || !name.trim()}
                className="flex-1 py-3.5 rounded-full font-medium text-sm transition-all hover:opacity-80 disabled:opacity-50 border border-stone-200 text-stone-600"
              >
                {saving ? 'Saving…' : 'Save & add another'}
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#AA8EA0' }}
              >
                {saving ? 'Saving…' : 'Save & close'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
