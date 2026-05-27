-- Migration: create_wardrobe

create table public.clothing_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('tops','bottoms','dresses','shoes','accessories','outerwear')),
  color text,
  season text[] default '{}',
  tags text[] default '{}',
  image_url text,
  thumbnail_url text,
  brand text,
  is_favorite boolean default false,
  times_worn integer default 0,
  last_worn_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index clothing_items_user_id_idx on public.clothing_items(user_id);
create index clothing_items_category_idx on public.clothing_items(category);

alter table public.clothing_items enable row level security;
create policy "Users manage own clothing" on public.clothing_items for all using (auth.uid() = user_id);
