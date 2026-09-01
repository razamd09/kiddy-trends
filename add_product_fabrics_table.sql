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
    ('Cotton', 'data:image/svg+xml;charset=UTF-8,' || encode('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#F3E7D3"/><g opacity="0.45"><path d="M0 90 H300 M0 160 H300 M0 230 H300" stroke="#D7B98F" stroke-width="12"/><path d="M100 0 V300 M200 0 V300" stroke="#EAD8B8" stroke-width="9"/></g><text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="36" fill="#734A26">Cotton</text></svg>', 'base64'), 1, TRUE),
    ('Terry', 'data:image/svg+xml;charset=UTF-8,' || encode('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#D7B38A"/><g opacity="0.5"><path d="M0 60 L300 60 M0 120 L300 120 M0 180 L300 180 M0 240 L300 240" stroke="#A77A4A" stroke-width="9"/><path d="M60 0 V300 M150 0 V300 M240 0 V300" stroke="#B78D5D" stroke-width="9"/></g><text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="36" fill="#4E2F1D">Terry</text></svg>', 'base64'), 2, TRUE),
    ('Jersy', 'data:image/svg+xml;charset=UTF-8,' || encode('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#CFE7C5"/><g opacity="0.45"><path d="M40 20 C105 115, 165 115, 260 20" fill="none" stroke="#8DBB7C" stroke-width="18"/><path d="M20 160 C95 230, 190 230, 280 160" fill="none" stroke="#7AA56B" stroke-width="16"/></g><text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="34" fill="#315332">Jersy</text></svg>', 'base64'), 3, TRUE),
    ('Fleece', 'data:image/svg+xml;charset=UTF-8,' || encode('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#D8C2A7"/><g opacity="0.5"><circle cx="70" cy="80" r="42" fill="#B99876"/><circle cx="150" cy="150" r="46" fill="#C9A884"/><circle cx="230" cy="95" r="37" fill="#B48C63"/><path d="M30 220 C100 260, 200 260, 270 220" fill="none" stroke="#9D7F5C" stroke-width="18"/></g><text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="34" fill="#4C3423">Fleece</text></svg>', 'base64'), 4, TRUE),
    ('Silk Cotton', 'data:image/svg+xml;charset=UTF-8,' || encode('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#F8E8E6"/><g opacity="0.45"><path d="M0 110 C60 80, 100 70, 150 110 C210 150, 250 150, 300 110" fill="none" stroke="#D8B4AE" stroke-width="18"/><path d="M0 180 C75 150, 115 160, 150 190 C190 220, 230 220, 300 180" fill="none" stroke="#C89A94" stroke-width="18"/></g><text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="26" fill="#6A4948">Silk Cotton</text></svg>', 'base64'), 5, TRUE),
    ('Silk', 'data:image/svg+xml;charset=UTF-8,' || encode('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EFD9EC"/><g opacity="0.45"><path d="M65 60 C95 150, 105 210, 150 260 C195 210, 205 150, 235 60" fill="none" stroke="#D5A4CF" stroke-width="18"/><path d="M115 40 C125 110, 135 150, 150 175 C165 150, 175 110, 185 40" fill="none" stroke="#C88EC3" stroke-width="10"/></g><text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="36" fill="#6F4568">Silk</text></svg>', 'base64'), 6, TRUE),
    ('Denim', 'data:image/svg+xml;charset=UTF-8,' || encode('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#2F4D6B"/><g opacity="0.5"><path d="M0 40 H300 M0 110 H300 M0 180 H300 M0 250 H300" stroke="#5C7FA5" stroke-width="12"/><path d="M90 0 V300 M170 0 V300 M250 0 V300" stroke="#6C90B7" stroke-width="8"/></g><text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="34" fill="#EAF4FF">Denim</text></svg>', 'base64'), 7, TRUE)
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
