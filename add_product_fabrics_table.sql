-- Migration: Create product_fabrics lookup table
-- Run this in Supabase SQL editor (or psql) as an admin user.

CREATE TABLE IF NOT EXISTS product_fabrics (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_fabrics_active_sort
    ON product_fabrics (is_active, sort_order, name);

INSERT INTO product_fabrics (name, sort_order, is_active)
VALUES
    ('Cotton', 1, TRUE),
    ('Terry', 2, TRUE),
    ('Jersy', 3, TRUE),
    ('Fleece', 4, TRUE),
    ('Silk Cotton', 5, TRUE),
    ('Silk', 6, TRUE),
    ('Denim', 7, TRUE)
ON CONFLICT DO NOTHING;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS fabric_id BIGINT REFERENCES product_fabrics(id);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS fabric TEXT;

-- Backfill fabric text from fabric_id for existing products, if needed
UPDATE products p
SET fabric = f.name
FROM product_fabrics f
WHERE p.fabric_id = f.id
  AND (p.fabric IS NULL OR TRIM(p.fabric) = '');

-- Backfill common material from title keywords when fabric is empty
UPDATE products
SET fabric = CASE
    WHEN LOWER(title) LIKE '%fleece%' THEN 'Fleece'
    WHEN LOWER(title) LIKE '%cotton%' THEN 'Cotton'
    WHEN LOWER(title) LIKE '%terry%' THEN 'Terry'
    WHEN LOWER(title) LIKE '%denim%' THEN 'Denim'
    WHEN LOWER(title) LIKE '%silk cotton%' THEN 'Silk Cotton'
    WHEN LOWER(title) LIKE '%silk%' THEN 'Silk'
    WHEN LOWER(title) LIKE '%jersey%' OR LOWER(title) LIKE '%jersy%' THEN 'Jersy'
    ELSE fabric
END
WHERE fabric IS NULL OR TRIM(fabric) = '';
