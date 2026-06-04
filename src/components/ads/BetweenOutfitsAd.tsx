'use client'

import { ExternalLink, ShoppingBag } from 'lucide-react'
import { FEATURED_PRODUCTS, buildAffiliateUrl, type AffiliateProduct } from '@/lib/ads-config'

// Picks a product deterministically based on the current day so the ad
// rotates daily without needing a network call.
function getDailyProduct(): AffiliateProduct {
  const dayIndex = Math.floor(Date.now() / 86_400_000) % FEATURED_PRODUCTS.length
  return FEATURED_PRODUCTS[dayIndex]
}

const CATEGORY_COLORS: Record<string, string> = {
  dresses: '#F5E8F0',
  bottoms: '#EBF3EC',
  outerwear: '#F0EBF2',
  accessories: '#E8EFF5',
  shoes: '#F0EDE8',
  tops: '#EDE8F5',
}

export default function BetweenOutfitsAd() {
  const product = getDailyProduct()
  const href = buildAffiliateUrl(product)
  const bg = CATEGORY_COLORS[product.category] ?? '#F5EEF3'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
      aria-label={`Sponsored: ${product.title} by ${product.brand}`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white">
        {/* Product color swatch / placeholder image */}
        <div
          className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: bg }}
        >
          <ShoppingBag size={22} style={{ color: '#725265', opacity: 0.5 }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Sponsored label */}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-300">
            Sponsored
          </span>
          <p className="font-medium text-stone-800 text-sm leading-snug truncate mt-0.5">
            {product.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-stone-400">{product.brand}</span>
            <span className="text-stone-200 text-xs">·</span>
            <span className="text-xs font-semibold" style={{ color: '#725265' }}>
              {product.price}
            </span>
          </div>
        </div>

        <div
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
          style={{ background: '#AA8EA0' }}
        >
          Shop
          <ExternalLink size={10} />
        </div>
      </div>
    </a>
  )
}
