# Stylemind — Development Handoff

## Repo
- **GitHub:** https://github.com/Reluyo/Stylemind
- **Default branch:** `main`
- **Push via:** `git push "https://Claude:<YOUR_GITHUB_TOKEN>@github.com/Reluyo/Stylemind.git" <branch>`
  *(Generate a token at GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained, with repo write access)*

## Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS — colors: `#AA8EA0` (mauve), `#725265` (dark mauve), `#F5EEF3` (light blush)
- **Database/Auth:** Supabase (PostgreSQL + RLS)
  - URL: https://yhazjbywrvzqwvgtcecp.supabase.co
  - Project ID: yhazjbywrvzqwvgtcecp
  - Anon key + env vars already in `.env.local`
- **AI:** Anthropic Claude SDK (`@anthropic-ai/sdk`)
- **Mobile-first:** max-width 430px container

## App Structure
```
src/app/
  (app)/          <- protected routes (require auth)
    today/        <- AI outfit generation, weather, stylist chat, wear tracking
    wardrobe/     <- clothing items + saved outfits + stats tabs
    planner/      <- Mon-Fri week planner
    trip-planner/ <- packing list generator
    profile/      <- user settings, plan badge, upgrade CTA, device location
  (auth)/
    login/
    signup/       <- auto-seeds 24 demo wardrobe items on signup
  api/
    outfits/generate  <- Claude: generates outfit suggestions
    outfits/save      <- saves outfit to DB
    outfits/visualize <- Replicate: AI try-on image (Pro only)
    stylist/chat      <- Claude: streaming stylist chat
    planner/week      <- Claude: Mon-Fri outfit plan
    planner/trip      <- Claude: packing list
    wardrobe/analyze  <- Claude Haiku: clothing photo analysis
    weather/          <- Open-Meteo: weather summary
src/components/
  BottomNav.tsx
  HamburgerMenu.tsx
  AddItemModal.tsx
  ShareOutfitModal.tsx
  ads/
    BetweenOutfitsAd.tsx   <- shown between outfit cards (free users only)
    WardrobeFooterAd.tsx   <- "Discover New Pieces" grid (free users only)
    StylistStripAd.tsx     <- horizontal chips above chat (free users only)
src/lib/
  ads-config.ts   <- Amazon Associates config — INACTIVE until launch
  types.ts
  supabase.ts
  ai.ts
```

## Subscription Tiers
- **Free:** 30 wardrobe items, 3 daily outfits, no AI stylist, no planner, no try-on
- **Pro ($9/mo):** unlimited items, 5 outfits, stylist chat, week planner, AI try-on images
- Plan stored in `profiles.plan` ('free' | 'pro') in Supabase
- **Stripe: NOT YET BUILT** — upgrade button shows alert('Stripe coming soon')

## Ads System (Free Tier)
- Config: `src/lib/ads-config.ts`
- Currently INACTIVE (`ACTIVE: false`) — links go to Amazon search, no commission
- To activate after Amazon Associates approval:
  1. Set `ACTIVE: true`
  2. Replace `ASSOCIATE_TAG: 'stylemind-20'` with your real tag
  3. Replace placeholder ASINs (B08XXXX001 etc.) with real ASINs from Amazon SiteStripe
- Products rotate daily via day-index (no API call needed)
- All ad components are gated: only shown when `!isPro`

## Database
Tables (all RLS-enabled): profiles, clothing_items, outfits, outfit_items, planned_outfits, daily_recommendations
Migrations: supabase/migrations/
Key helpers: seed_demo_wardrobe(), handle_new_user() trigger, set_updated_at() trigger

## What's Done
- [x] Full auth flow (signup/login/signout)
- [x] AI outfit generation with weather context + style preferences
- [x] AI stylist chat (streaming, shown after outfits generated)
- [x] Week planner + trip packing list
- [x] Clothing upload modal (AddItemModal) + AI photo analysis (Haiku)
- [x] Outfit saving, favorites, wear tracking ("Wore this" button)
- [x] Wardrobe stats tab (category bars, seasonal gaps, most worn)
- [x] Outfit sharing (Web Share API + clipboard fallback)
- [x] AI try-on visualization (Pro only, via Replicate, polls for result)
- [x] Weather alert for planned outfits (once per day, localStorage-gated)
- [x] Style preferences + device location on profile page
- [x] Morning reminder time setting (DB column exists, UI built)
- [x] Free tier ad system (Amazon Associates, inactive pending approval)
- [x] Hamburger menu component

## What's Pending
- [ ] Stripe — Pro upgrade flow (button in profile/page.tsx, needs wiring)
- [ ] Activate ads — set Associate tag after Amazon Associates approval
- [ ] Push notifications — morning reminder (DB has morning_reminder_time, UI built, not wired to actual notifications)
- [ ] Wardrobe image storage — AddItemModal UI exists, Supabase Storage bucket may need confirming

## Design System
- Fonts: DM Sans (body) + Playfair Display (serif headings)
- Primary: #AA8EA0 | Dark: #725265 | Light bg: #F5EEF3
- Aesthetic: muted, feminine-leaning, editorial — premium fashion app
- Mobile-first, max-width 430px

## Starting a New Session
1. Create a new branch: git checkout -b claude/<session-name>
2. Tell Claude: "Continue building Stylemind. Read HANDOFF.md for full context."
3. When done: merge branch into main and push using the token in this file
