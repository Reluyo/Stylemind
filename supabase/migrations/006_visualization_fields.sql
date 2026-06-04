-- Migration: add outfit visualization fields to profiles
-- Applied to: yhazjbywrvzqwvgtcecp.supabase.co

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS viz_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS viz_reset_month TEXT NOT NULL DEFAULT '';

-- Add notification_frequency (migration 007 merged here for simplicity)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_frequency TEXT NOT NULL DEFAULT 'daily'
  CHECK (notification_frequency IN ('daily', 'weekly', 'none'));
