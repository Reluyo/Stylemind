// Amazon Associates configuration
// Set ACTIVE to true and fill in ASSOCIATE_TAG once your account is approved.
export const ADS_CONFIG = {
  ACTIVE: false,
  ASSOCIATE_TAG: 'stylemind-20', // replace with your actual tag before activating
}

export type AdPlacement = 'between-outfits' | 'wardrobe-footer' | 'stylist-strip'

export interface AffiliateProduct {
  id: string
  title: string
  brand: string
  price: string
  category: string
  asin: string           // Amazon product ID — used to build the affiliate link
  imageUrl: string       // placeholder image until real products are linked
  searchQuery: string    // fallback: opens Amazon search for this query
}

// Curated placeholder products — swap ASINs and images for real ones after approval
export const FEATURED_PRODUCTS: AffiliateProduct[] = [
  {
    id: 'p1',
    title: 'Classic Midi Wrap Dress',
    brand: 'Daily Ritual',
    price: '$42',
    category: 'dresses',
    asin: 'B08XXXX001',
    imageUrl: '',
    searchQuery: 'women midi wrap dress',
  },
  {
    id: 'p2',
    title: 'High-Rise Straight Jeans',
    brand: 'Levi\'s',
    price: '$59',
    category: 'bottoms',
    asin: 'B07XXXX002',
    imageUrl: '',
    searchQuery: 'women high rise straight leg jeans',
  },
  {
    id: 'p3',
    title: 'Oversized Linen Blazer',
    brand: 'The Drop',
    price: '$69',
    category: 'outerwear',
    asin: 'B09XXXX003',
    imageUrl: '',
    searchQuery: 'women oversized linen blazer',
  },
  {
    id: 'p4',
    title: 'Minimalist Leather Tote',
    brand: 'Fossil',
    price: '$128',
    category: 'accessories',
    asin: 'B06XXXX004',
    imageUrl: '',
    searchQuery: 'women minimalist leather tote bag',
  },
  {
    id: 'p5',
    title: 'Block Heel Mule Sandals',
    brand: 'Sam Edelman',
    price: '$89',
    category: 'shoes',
    asin: 'B08XXXX005',
    imageUrl: '',
    searchQuery: 'women block heel mule sandals',
  },
  {
    id: 'p6',
    title: 'Ribbed Knit Crew-Neck Top',
    brand: 'Amazon Essentials',
    price: '$22',
    category: 'tops',
    asin: 'B07XXXX006',
    imageUrl: '',
    searchQuery: 'women ribbed knit crew neck top',
  },
]

export function buildAffiliateUrl(product: AffiliateProduct): string {
  if (ADS_CONFIG.ACTIVE && ADS_CONFIG.ASSOCIATE_TAG !== 'stylemind-20') {
    // Direct product link with affiliate tag
    return `https://www.amazon.com/dp/${product.asin}?tag=${ADS_CONFIG.ASSOCIATE_TAG}`
  }
  // Placeholder: opens Amazon search (no commission, safe for pre-launch testing)
  return `https://www.amazon.com/s?k=${encodeURIComponent(product.searchQuery)}`
}
