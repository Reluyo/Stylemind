-- Migration: create_planner_and_recommendations

create table public.planned_outfits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  outfit_id uuid references public.outfits(id) on delete set null,
  planned_date date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, planned_date)
);

create index planned_outfits_user_date_idx on public.planned_outfits(user_id, planned_date);

alter table public.planned_outfits enable row level security;
create policy "Users manage own planned outfits" on public.planned_outfits for all using (auth.uid() = user_id);

create table public.daily_recommendations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  recommendation_date date not null,
  weather_summary jsonb,
  season text,
  day_of_week text,
  outfit_ids uuid[] default '{}',
  selected_outfit_id uuid references public.outfits(id) on delete set null,
  ai_context text,
  created_at timestamptz default now(),
  unique(user_id, recommendation_date)
);

create index daily_recs_user_date_idx on public.daily_recommendations(user_id, recommendation_date);

alter table public.daily_recommendations enable row level security;
create policy "Users manage own recommendations" on public.daily_recommendations for all using (auth.uid() = user_id);
