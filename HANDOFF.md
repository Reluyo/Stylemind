# StyleMind — Claude Code Handoff

## What this project is
StyleMind is an AI-powered outfit planning app. Users upload photos of their clothing items, and the app recommends daily outfits based on weather, season, and day of week. Built with Next.js 14, Supabase, and the Anthropic API.

## What's already been built (in claude.ai chat)
- ✅ Full clickable prototype (all screens)
- ✅ Supabase project created and live
- ✅ All database migrations applied and working
- ✅ Anthropic API wired for outfit generation, stylist chat, and week planner
- ✅ Auth (signup/login/signout) via Supabase Auth
- ✅ Demo wardrobe seed function (24 items auto-created for new users)

## Supabase project
- **URL:** https://yhazjbywrvzqwvgtcecp.supabase.co
- **Project ID:** yhazjbywrvzqwvgtcecp
- **Anon key:** in .env.local (already filled in)
- **Status:** ACTIVE_HEALTHY, all migrations applied

## Database schema (all live, RLS enabled)
- `profiles` — extends auth.users, has plan (free/pro), style_preferences, location
- `clothing_items` — wardrobe items with category, color, season, tags, image_url
- `outfits` — saved outfit combinations, ai_generated flag, try_on_image_url
- `outfit_items` — junction table linking outfits ↔ clothing_items
- `planned_outfits` — week planner, one outfit per user per date
- `daily_recommendations` — AI recommendation log with weather_summary jsonb
- `outfits_with_items` — view joining outfits with their items

## Key functions in Supabase
- `seed_demo_wardrobe(p_user_id uuid)` — seeds 24 demo clothing items for new users
- `set_updated_at()` — trigger to auto-update updated_at on all tables
- `handle_new_user()` — trigger to auto-create profile on auth.users insert

## App screens
1. **Landing** — marketing page with plan comparison (Free vs Pro)
2. **Sign up / Login** — Supabase Auth
3. **Today (Home)** — weather bar, AI-generated outfit cards (5), AI stylist chat, refine chips
4. **Wardrobe** — clothing grid with search, category filter, sort, upload tile
5. **Planner** — Mon–Fri week view, AI week plan generation
6. **Profile** — user stats, settings, upgrade prompt

## Subscription tiers
- **Free:** up to 30 items, 3 daily outfits, manual wardrobe, weather-aware
- **Pro ($9/mo):** unlimited items, 5 daily outfits, AI try-on images, full week planner, AI style chat

## API routes to build
- `POST /api/outfits/generate` — generate 5 outfit suggestions (uses wardrobe + weather)
- `POST /api/stylist/chat` — streaming stylist chat response
- `POST /api/planner/week` — generate full week outfit plan
- `POST /api/wardrobe/upload` — upload clothing item image to Supabase Storage (TODO)

## What to build next (priority order)
1. **Complete the Next.js app** — turn the scaffolded files into full working pages with proper routing
2. **Clothing photo uploads** — Supabase Storage bucket "wardrobe-images", drag-and-drop UI, auto-AI tagging (category/color detection from image)
3. **Outfit save flow** — save AI-generated outfits to the outfits table with their items
4. **Stripe integration** — Free → Pro upgrade, webhook to update profiles.plan
5. **AI try-on** — Pro feature: generate an image of the user wearing the outfit using their profile photo
6. **Week planner persistence** — save planned outfits to planned_outfits table
7. **Push notifications** — morning outfit reminder at user's preferred time

## Design system
- Font: DM Sans (body) + Playfair Display (headings)
- Brand color: #C8956C (warm terracotta)
- Brand light: #F5EDE6
- Brand dark: #8B5E3C
- Background: #FAF7F4
- Aesthetic: warm, editorial, refined — think premium fashion app, not generic SaaS

## How to get started in Claude Code
```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key to .env.local
# ANTHROPIC_API_KEY=sk-ant-...  ← get from console.anthropic.com

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
```

Then tell Claude Code:
> "Continue building StyleMind. Start by completing the Today screen with real Supabase data and the AI outfit generation flow. The scaffolding is already in place — see HANDOFF.md for full context."
