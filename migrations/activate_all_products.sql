-- Activate all products for display
-- This migration ensures is_active column exists and marks all products as active

-- Step 1: Add is_active column if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Update all existing products to be active (if they're not already)
UPDATE products
SET is_active = true
WHERE is_active IS NULL OR is_active = false;

-- Verify the changes
SELECT COUNT(*) as total_products, 
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
       COUNT(CASE WHEN is_active = false THEN 1 END) as draft_products
FROM products;
