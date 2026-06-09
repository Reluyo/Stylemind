-- Migration: onboarding flag + daily outfit-generation quota
-- Supports server-side paywall enforcement (free tier daily limit) and the
-- first-run onboarding flow.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS outfit_gen_date DATE,
  ADD COLUMN IF NOT EXISTS outfit_gen_count INT NOT NULL DEFAULT 0;

-- Atomically claim one daily outfit generation for a user.
-- Resets the counter when the date rolls over. Returns the new count for the
-- day, or NULL when the free-tier limit has already been reached.
CREATE OR REPLACE FUNCTION public.claim_outfit_generation(
  p_user_id UUID,
  p_limit INT
)
RETURNS INT AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'utc')::date;
  v_plan TEXT;
  v_count INT;
BEGIN
  SELECT plan,
         CASE WHEN outfit_gen_date = v_today THEN outfit_gen_count ELSE 0 END
    INTO v_plan, v_count
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Pro users are unmetered; still track usage for analytics.
  IF v_plan = 'pro' THEN
    UPDATE public.profiles
      SET outfit_gen_date = v_today, outfit_gen_count = v_count + 1
      WHERE id = p_user_id;
    RETURN v_count + 1;
  END IF;

  IF v_count >= p_limit THEN
    RETURN NULL;
  END IF;

  UPDATE public.profiles
    SET outfit_gen_date = v_today, outfit_gen_count = v_count + 1
    WHERE id = p_user_id;
  RETURN v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
