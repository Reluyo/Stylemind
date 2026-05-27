-- Migration: create_outfits

create table public.outfits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  occasion text,
  season text[] default '{}',
  tags text[] default '{}',
  ai_generated boolean default false,
  ai_prompt text,
  try_on_image_url text,
  is_favorite boolean default false,
  times_worn integer default 0,
  last_worn_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.outfit_items (
  id uuid default uuid_generate_v4() primary key,
  outfit_id uuid references public.outfits(id) on delete cascade not null,
  clothing_item_id uuid references public.clothing_items(id) on delete cascade not null,
  unique(outfit_id, clothing_item_id)
);

create index outfits_user_id_idx on public.outfits(user_id);
create index outfit_items_outfit_id_idx on public.outfit_items(outfit_id);

alter table public.outfits enable row level security;
create policy "Users manage own outfits" on public.outfits for all using (auth.uid() = user_id);

alter table public.outfit_items enable row level security;
create policy "Users manage own outfit items" on public.outfit_items for all
  using (exists (select 1 from public.outfits where id = outfit_id and user_id = auth.uid()));
