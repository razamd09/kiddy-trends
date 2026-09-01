-- Migration: Add fabric column for products
-- Run this in Supabase SQL editor (or psql) as an admin user.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS fabric TEXT;

-- Existing products will be updated in a separate data-cleanup step after this migration.
-- Example:
-- UPDATE products
-- SET fabric = 'Cotton'
-- WHERE fabric IS NULL OR TRIM(fabric) = '';
