'use client'

import { ExternalLink } from 'lucide-react'
import { FEATURED_PRODUCTS, buildAffiliateUrl } from '@/lib/ads-config'

// Show 3 horizontally scrollable chips — offset by 3 from the daily pick
function getStripProducts() {
  const base = Math.floor(Date.now() / 86_400_000)
  return [0, 1, 2].map((offset) => FEATURED_PRODUCTS[(base + 3 + offset) % FEATURED_PRODUCTS.length])
}

export default function StylistStripAd() {
  const products = getStripProducts()

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-medium text-stone-500">Shop similar</span>
        <span className="ml-auto text-[10px] text-stone-300 font-medium uppercase tracking-wider">
          Sponsored
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {products.map((product) => (
          <a
            key={product.id}
            href={buildAffiliateUrl(product)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border border-stone-200 bg-white hover:border-[#AA8EA0] transition-colors"
            aria-label={`Sponsored: ${product.title}`}
          >
            <span className="text-xs font-medium text-stone-700 whitespace-nowrap">
              {product.title}
            </span>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#725265' }}>
              {product.price}
            </span>
            <ExternalLink size={9} className="text-stone-300 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  )
}
