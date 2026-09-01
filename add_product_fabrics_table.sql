-- Migration: Create product_fabrics lookup table
-- Run this in Supabase SQL editor (or psql) as an admin user.

CREATE TABLE IF NOT EXISTS product_fabrics (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_fabrics
ADD COLUMN IF NOT EXISTS image TEXT;

CREATE INDEX IF NOT EXISTS idx_product_fabrics_active_sort
    ON product_fabrics (is_active, sort_order, name);

INSERT INTO product_fabrics (name, image, sort_order, is_active)
VALUES
    ('Cotton', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80', 1, TRUE),
    ('Terry', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80', 2, TRUE),
    ('Jersy', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80', 3, TRUE),
    ('Fleece', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80', 4, TRUE),
    ('Silk Cotton', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80', 5, TRUE),
    ('Silk', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80', 6, TRUE),
    ('Denim', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80', 7, TRUE)
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
