-- Migration: create_profiles
-- Already applied to: yhazjbywrvzqwvgtcecp.supabase.co
-- Run via: Supabase dashboard > SQL editor, or supabase db push

create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  location text,
  style_preferences text[] default '{}',
  plan text not null default 'free' check (plan in ('free', 'pro')),
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  morning_reminder_time time default '07:30',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
