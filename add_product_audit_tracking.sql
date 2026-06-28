-- Add product audit tracking columns
-- Run in Supabase SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS last_action_by TEXT,
ADD COLUMN IF NOT EXISTS last_action_type TEXT,
ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMP;

-- Set defaults for existing products (assume admin added them)
UPDATE products
SET 
  last_action_by = 'admin',
  last_action_type = 'added',
  last_action_at = created_at
WHERE last_action_by IS NULL;
