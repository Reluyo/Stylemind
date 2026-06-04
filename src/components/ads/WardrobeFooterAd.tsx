'use client'

import { ExternalLink, ShoppingBag, Sparkles } from 'lucide-react'
import { FEATURED_PRODUCTS, buildAffiliateUrl } from '@/lib/ads-config'

// Show 2 products — offset by 1 from the daily pick so it's different from BetweenOutfitsAd
function getTwoProducts() {
  const base = Math.floor(Date.now() / 86_400_000)
  const a = FEATURED_PRODUCTS[(base + 1) % FEATURED_PRODUCTS.length]
  const b = FEATURED_PRODUCTS[(base + 2) % FEATURED_PRODUCTS.length]
  return [a, b]
}

const CATEGORY_COLORS: Record<string, string> = {
  dresses: '#F5E8F0',
  bottoms: '#EBF3EC',
  outerwear: '#F0EBF2',
  accessories: '#E8EFF5',
  shoes: '#F0EDE8',
  tops: '#EDE8F5',
}

export default function WardrobeFooterAd() {
  const [p1, p2] = getTwoProducts()

  return (
    <div className="mt-6 mb-4">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles size={13} style={{ color: '#AA8EA0' }} />
        <span className="text-xs font-semibold text-stone-500">Discover New Pieces</span>
        <span className="ml-auto text-[10px] text-stone-300 font-medium uppercase tracking-wider">
          Sponsored
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[p1, p2].map((product) => {
          const bg = CATEGORY_COLORS[product.category] ?? '#F5EEF3'
          return (
            <a
              key={product.id}
              href={buildAffiliateUrl(product)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm bg-white hover:shadow-md transition-shadow"
              aria-label={`Sponsored: ${product.title}`}
            >
              {/* Image placeholder */}
              <div
                className="w-full h-32 flex items-center justify-center"
                style={{ background: bg }}
              >
                <ShoppingBag size={28} style={{ color: '#725265', opacity: 0.35 }} />
              </div>
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium text-stone-800 leading-snug truncate">
                  {product.title}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-stone-400 truncate">{product.brand}</span>
                  <span className="text-xs font-semibold flex-shrink-0 ml-1" style={{ color: '#725265' }}>
                    {product.price}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: '#AA8EA0' }}>
                  Shop on Amazon <ExternalLink size={9} />
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
