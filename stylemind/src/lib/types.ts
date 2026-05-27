export type Plan = 'free' | 'pro'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  location: string | null
  style_preferences: string[]
  plan: Plan
  subscription_started_at: string | null
  subscription_expires_at: string | null
  morning_reminder_time: string
  created_at: string
  updated_at: string
}

export type ClothingCategory = 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'accessories' | 'outerwear'

export interface ClothingItem {
  id: string
  user_id: string
  name: string
  category: ClothingCategory
  color: string | null
  season: string[]
  tags: string[]
  image_url: string | null
  thumbnail_url: string | null
  brand: string | null
  is_favorite: boolean
  times_worn: number
  last_worn_at: string | null
  created_at: string
  updated_at: string
}

export interface Outfit {
  id: string
  user_id: string
  name: string
  occasion: string | null
  season: string[]
  tags: string[]
  ai_generated: boolean
  ai_prompt: string | null
  try_on_image_url: string | null
  is_favorite: boolean
  times_worn: number
  last_worn_at: string | null
  created_at: string
  updated_at: string
  items?: ClothingItem[]
}

export interface PlannedOutfit {
  id: string
  user_id: string
  outfit_id: string | null
  planned_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DailyRecommendation {
  id: string
  user_id: string
  recommendation_date: string
  weather_summary: WeatherSummary | null
  season: string | null
  day_of_week: string | null
  outfit_ids: string[]
  selected_outfit_id: string | null
  ai_context: string | null
  created_at: string
}

export interface WeatherSummary {
  temp_f: number
  condition: string
  location: string
  season: string
}

export interface AIOutfitSuggestion {
  name: string
  occasion: string
  items: string[]
  style_tag: string
  reason: string
}
