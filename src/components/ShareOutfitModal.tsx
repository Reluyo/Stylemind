'use client'

import { useState } from 'react'
import { X, Copy, Check, Share2 } from 'lucide-react'
import type { Outfit } from '@/lib/types'

type OutfitWithItems = Outfit & {
  outfit_items?: { clothing_items: { name: string; category: string } | null }[]
}

interface Props {
  outfit: OutfitWithItems
  onClose: () => void
}

export default function ShareOutfitModal({ outfit, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const itemNames = outfit.outfit_items
    ?.map((oi) => oi.clothing_items?.name)
    .filter(Boolean) as string[] | undefined

  const shareText = [
    `✨ ${outfit.name}`,
    outfit.occasion ? `Occasion: ${outfit.occasion}` : null,
    itemNames?.length
      ? `\nItems:\n${itemNames.map((n) => `• ${n}`).join('\n')}`
      : null,
    '\n— Styled with StyleMind',
  ]
    .filter(Boolean)
    .join('\n')

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title: outfit.name, text: shareText }) } catch {}
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <h2 className="font-serif text-lg font-semibold text-stone-900">Share outfit</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 transition-colors">
            <X size={16} className="text-stone-500" />
          </button>
        </div>

        <div className="p-5">
          {/* Styled preview card */}
          <div
            className="rounded-2xl p-5 mb-5"
            style={{ background: 'linear-gradient(135deg, #F5EEF3, #EDE8F5)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#AA8EA0' }}>
              StyleMind · Outfit
            </p>
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">{outfit.name}</h3>
            {outfit.occasion && (
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: 'white', color: '#725265' }}
              >
                {outfit.occasion}
              </span>
            )}
            {itemNames && itemNames.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {itemNames.map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#AA8EA0' }} />
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            {canShare && (
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-80"
                style={{ background: '#AA8EA0' }}
              >
                <Share2 size={15} />
                Share
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-stone-200 transition-all hover:bg-stone-50"
              style={{ color: copied ? '#AA8EA0' : '#4a3545' }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy text'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
