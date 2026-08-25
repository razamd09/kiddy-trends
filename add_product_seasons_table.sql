-- Creates product_seasons lookup table and links products to a season.

CREATE TABLE IF NOT EXISTS product_seasons (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO product_seasons (name, sort_order)
VALUES
  ('Winter', 10),
  ('Summer', 20),
  ('Mid_Weather', 30)
ON CONFLICT (name) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_season_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_product_season_id_fkey'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_product_season_id_fkey
    FOREIGN KEY (product_season_id)
    REFERENCES product_seasons(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_products_product_season_id
ON products(product_season_id);

-- Backfill product season from title keywords.
-- Priority: Mid_Weather (mid/full sleeves) > Winter > Summer.
WITH season_ids AS (
  SELECT
    MAX(CASE WHEN LOWER(name) = 'winter' THEN id END) AS winter_id,
    MAX(CASE WHEN LOWER(name) = 'summer' THEN id END) AS summer_id,
    MAX(CASE WHEN LOWER(name) = 'mid_weather' THEN id END) AS mid_weather_id
  FROM product_seasons
)
UPDATE products p
SET
  product_season_id = CASE
    WHEN LOWER(COALESCE(p.title, '')) LIKE '%mid%'
      OR LOWER(COALESCE(p.title, '')) LIKE '%full sleeves%'
      OR LOWER(COALESCE(p.title, '')) LIKE '%full sleeve%'
      OR LOWER(COALESCE(p.title, '')) LIKE '%mid weather%'
      THEN s.mid_weather_id
    WHEN LOWER(COALESCE(p.title, '')) LIKE '%winter%'
      THEN s.winter_id
    WHEN LOWER(COALESCE(p.title, '')) LIKE '%summer%'
      THEN s.summer_id
    ELSE p.product_season_id
  END,
  updated_at = NOW()
FROM season_ids s
WHERE (
  LOWER(COALESCE(p.title, '')) LIKE '%winter%'
  OR LOWER(COALESCE(p.title, '')) LIKE '%summer%'
  OR LOWER(COALESCE(p.title, '')) LIKE '%mid%'
  OR LOWER(COALESCE(p.title, '')) LIKE '%full sleeves%'
  OR LOWER(COALESCE(p.title, '')) LIKE '%full sleeve%'
  OR LOWER(COALESCE(p.title, '')) LIKE '%mid weather%'
)
AND (
  p.product_season_id IS DISTINCT FROM CASE
    WHEN LOWER(COALESCE(p.title, '')) LIKE '%mid%'
      OR LOWER(COALESCE(p.title, '')) LIKE '%full sleeves%'
      OR LOWER(COALESCE(p.title, '')) LIKE '%full sleeve%'
      OR LOWER(COALESCE(p.title, '')) LIKE '%mid weather%'
      THEN s.mid_weather_id
    WHEN LOWER(COALESCE(p.title, '')) LIKE '%winter%'
      THEN s.winter_id
    WHEN LOWER(COALESCE(p.title, '')) LIKE '%summer%'
      THEN s.summer_id
    ELSE p.product_season_id
  END
);
