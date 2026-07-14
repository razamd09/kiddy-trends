CREATE TABLE IF NOT EXISTS product_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO product_types (name, sort_order)
VALUES
  ('T-Shirt', 10),
  ('Full Sleeves Shirt', 20),
  ('Shorts', 30),
  ('Denim Jeans', 40),
  ('Trouser', 50),
  ('Girl-Top', 60),
  ('Frock', 70),
  ('Socks', 80),
  ('Jacket', 90),
  ('Button Shirts', 100),
  ('Jeans Shorts', 110),
  ('Cargo Pents', 120),
  ('Cargo Trousers', 130),
  ('School Bags', 140),
  ('Ladies Bags', 150),
  ('Bag-Pack', 160),
  ('Rompers', 170),
  ('Kurta Trouser', 180),
  ('Girls Kurti with Gharara', 190),
  ('Girls Kurti with Trouser', 200)
ON CONFLICT (name) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
