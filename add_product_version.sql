-- Migration: Add product_version column and set values
-- Run this in Supabase SQL editor (or psql) as an admin user.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_version TEXT;

-- Set product_version for titles that contain "Summer new Arrival 2026"
UPDATE products
SET product_version = 'new arrivals'
WHERE LOWER(title) LIKE '%summer new arrival 2026%';

-- Set remaining products to Old Packs where product_version is NULL or empty
UPDATE products
SET product_version = 'Old Packs'
WHERE product_version IS NULL OR TRIM(product_version) = '';