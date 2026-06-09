'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Upload, Sparkles, Loader2, Check } from 'lucide-react'
import type { ClothingCategory } from '@/lib/types'

const CATEGORIES: { label: string; value: ClothingCategory }[] = [
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Outerwear', value: 'outerwear' },
]

interface Box { x: number; y: number; w: number; h: number }

interface DetectedItem {
  name: string
  category: ClothingCategory
  color: string
  tags: string[]
  box: Box | null
  selected: boolean
}

// Crop a region (with a little padding) out of an image file into a PNG blob.
function cropToBox(file: File, box: Box, pad = 0.04): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objUrl)
      const px = Math.max(0, box.x - pad) * img.width
      const py = Math.max(0, box.y - pad) * img.height
      const sw = Math.min(img.width - px, (box.w + pad * 2) * img.width)
      const sh = Math.min(img.height - py, (box.h + pad * 2) * img.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(sw))
      canvas.height = Math.max(1, Math.round(sh))
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('no ctx')); return }
      ctx.drawImage(img, px, py, sw, sh, 0, 0, sw, sh)
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('no blob')), 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('load failed')) }
    img.src = objUrl
  })
}

interface Props {
  userId: string
  onClose: () => void
  onSaved: () => void
}

export default function DetectOutfitModal({ userId, onClose, onSaved }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingMsg, setSavingMsg] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [items, setItems] = useState<DetectedItem[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image is too large — max 5 MB.'); return }
    setError('')
    setItems([])
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    detect(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function detect(file: File) {
    setDetecting(true)
    setError('')
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/wardrobe/detect-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Could not detect items.')
        return
      }
      setItems(
        (data.items as Omit<DetectedItem, 'selected'>[]).map((it) => ({ ...it, selected: true }))
      )
      setError('')
    } catch {
      setError('Something went wrong analyzing the photo.')
    } finally {
      setDetecting(false)
    }
  }

  function toggle(idx: number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it))
  }

  function updateName(idx: number, name: string) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, name } : it))
  }

  function updateCategory(idx: number, category: ClothingCategory) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, category } : it))
  }

  async function saveSelected() {
    const chosen = items.filter((it) => it.selected && it.name.trim())
    if (!chosen.length) { setError('Select at least one item to save.'); return }
    if (!imageFile) { setError('No photo to save.'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()

    async function uploadBlob(blob: Blob, suffix: string): Promise<string | null> {
      const path = `${userId}/${Date.now()}-${suffix}-${Math.random().toString(36).slice(2, 7)}.png`
      const { error: upErr } = await supabase.storage
        .from('wardrobe-images')
        .upload(path, blob, { contentType: blob.type || 'image/png', upsert: false })
      if (upErr) return null
      return supabase.storage.from('wardrobe-images').getPublicUrl(path).data.publicUrl
    }

    try {
      // Fall back to the whole outfit photo only for items with no usable box.
      let fullUrl: string | null = null
      const needFull = chosen.some((it) => !it.box)
      if (needFull) fullUrl = await uploadBlob(imageFile, 'outfit')

      setSavingMsg(`Cutting out ${chosen.length} item${chosen.length === 1 ? '' : 's'}…`)

      // Crop + clean each item in parallel. Each step degrades gracefully:
      // clean cutout → raw crop → full outfit photo.
      const rows = await Promise.all(chosen.map(async (it, i) => {
        let imageUrl = fullUrl
        if (it.box) {
          try {
            const crop = await cropToBox(imageFile!, it.box)
            const cropUrl = await uploadBlob(crop, `item${i}`)
            imageUrl = cropUrl ?? fullUrl
            // Best-effort background removal for a clean isolated cutout.
            if (cropUrl) {
              try {
                const res = await fetch('/api/wardrobe/remove-bg', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageUrl: cropUrl }),
                })
                if (res.ok) {
                  const { imageUrl: cleanUrl } = await res.json()
                  const cleanBlob = await (await fetch(cleanUrl)).blob()
                  const finalUrl = await uploadBlob(cleanBlob, `item${i}-clean`)
                  if (finalUrl) imageUrl = finalUrl
                }
              } catch { /* keep the raw crop */ }
            }
          } catch { /* keep fullUrl */ }
        }
        return {
          user_id: userId,
          name: it.name.trim(),
          category: it.category,
          color: it.color.trim() || null,
          brand: null,
          season: [],
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          tags: it.tags,
        }
      }))

      const { error: insertError } = await supabase.from('clothing_items').insert(rows)
      if (insertError) {
        setError('Failed to save items: ' + insertError.message)
        setSaving(false)
        setSavingMsg('')
        return
      }
      onSaved()
    } catch {
      setError('Something went wrong')
      setSaving(false)
      setSavingMsg('')
    }
  }

  const selectedCount = items.filter((it) => it.selected).length

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
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-xl font-bold text-stone-900">Add from a photo</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 transition-colors">
              <X size={18} className="text-stone-500" />
            </button>
          </div>
          <p className="text-xs text-stone-500 mb-5">
            Upload a photo of yourself in an outfit — AI pulls out each piece as a separate wardrobe item.
          </p>

          {/* Image upload */}
          <div
            className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
              dragging ? 'border-[#AA8EA0] bg-[#FAF6F9]' : 'border-stone-200 bg-stone-50'
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {imagePreview ? (
              <img src={imagePreview} alt="Outfit" className="w-full h-56 object-cover rounded-2xl" />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Upload size={24} className="text-stone-300" />
                <p className="text-sm text-stone-400">Tap or drag an outfit photo</p>
                <p className="text-xs text-stone-300">Full-body works best — max 5 MB</p>
              </div>
            )}
          </div>

          {detecting && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-stone-500">
              <Loader2 size={16} className="animate-spin" />
              Finding the pieces in your outfit…
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl mt-3">{error}</p>
          )}

          {/* Detected items */}
          {items.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                {items.length} item{items.length > 1 ? 's' : ''} found — tap to edit, untick to skip
              </p>
              <div className="space-y-2.5">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border p-3 transition-all"
                    style={it.selected ? { borderColor: '#AA8EA0', background: '#FAF6F9' } : { borderColor: '#e7e3e6', opacity: 0.6 }}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggle(idx)}
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border transition-all"
                        style={it.selected
                          ? { background: '#AA8EA0', borderColor: '#AA8EA0' }
                          : { background: 'white', borderColor: '#d6d3d1' }}
                      >
                        {it.selected && <Check size={14} className="text-white" />}
                      </button>
                      <input
                        value={it.name}
                        onChange={(e) => updateName(idx, e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-sm font-medium text-stone-800 outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-8">
                      {CATEGORIES.map(({ label, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateCategory(idx, value)}
                          className="text-xs font-medium px-2.5 py-1 rounded-full transition-all"
                          style={it.category === value
                            ? { background: '#AA8EA0', color: 'white' }
                            : { background: 'white', color: '#78716c', border: '1px solid #e7e3e6' }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={saveSelected}
                disabled={saving || selectedCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-5"
                style={{ background: '#AA8EA0' }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {saving ? (savingMsg || 'Saving…') : `Add ${selectedCount} item${selectedCount === 1 ? '' : 's'} to wardrobe`}
              </button>
              <p className="text-xs text-stone-400 text-center mt-2.5 leading-relaxed">
                We isolate each piece automatically. For the sharpest AI try-on,
                you can later swap in a clean, flat photo of any item.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
