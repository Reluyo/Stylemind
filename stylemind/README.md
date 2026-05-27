# StyleMind 👗✨

AI-powered outfit planner. Get daily outfit recommendations based on your wardrobe, weather, and personal style.

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + RLS)
- **AI:** Anthropic Claude (outfit generation, stylist chat, week planning)
- **Payments:** Stripe (coming soon)

## Getting started

```bash
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |

## Features
- 🤖 AI outfit generation based on weather + wardrobe
- 💬 AI stylist chat — refine outfits conversationally  
- 📅 Week planner with AI suggestions
- 👗 Full wardrobe management
- 🪞 AI try-on images (Pro)
- 🔐 Auth + free/pro subscription tiers

## Project structure
```
src/
  app/          # Next.js App Router pages + API routes
  components/   # React components by feature
  lib/          # Supabase client, AI helpers, types
supabase/
  migrations/   # All DB migrations (already applied)
```

See [HANDOFF.md](./HANDOFF.md) for full context when working with Claude Code.
