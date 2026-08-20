-- Migration: Add title column to discount_codes table
-- Run this in Supabase SQL editor as an admin user

ALTER TABLE discount_codes
ADD COLUMN IF NOT EXISTS title VARCHAR(120);

-- Optional backfill so old codes still have meaningful title text
UPDATE discount_codes
SET title = COALESCE(NULLIF(title, ''), 'Promo Code');

ALTER TABLE discount_codes
ALTER COLUMN title SET NOT NULL;
