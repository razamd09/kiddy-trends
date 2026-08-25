CREATE TABLE IF NOT EXISTS product_versions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO product_versions (name, sort_order)
VALUES
  ('new arrivals', 10),
  ('Old Packs', 20)
ON CONFLICT (name) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    updated_at = NOW();