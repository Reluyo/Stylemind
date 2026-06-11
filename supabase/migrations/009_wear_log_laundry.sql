-- Laundry awareness: track which items are currently in laundry
ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS in_laundry BOOLEAN DEFAULT FALSE;

-- Wear log: record each time a user marks an outfit as worn
CREATE TABLE IF NOT EXISTS wear_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
  outfit_name TEXT,
  worn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wear_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wear log" ON wear_log FOR ALL USING (auth.uid() = user_id);
CREATE INDEX wear_log_user_date_idx ON wear_log(user_id, worn_date DESC);
