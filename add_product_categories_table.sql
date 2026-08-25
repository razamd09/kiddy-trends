CREATE TABLE IF NOT EXISTS product_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO product_categories (name, sort_order)
VALUES
  ('Clothing', 10),
  ('Bedding', 20),
  ('Bags', 30),
  ('Accessories', 40),
  ('Footwear', 50),
  ('Toys', 60),
  ('Shoes', 70),
  ('Other', 80)
ON CONFLICT (name) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    updated_at = NOW();