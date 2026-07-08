-- Customers module table (admin)
-- Stores only first name, last name, and phone extracted from checkout orders.

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL,
    order_source TEXT NOT NULL DEFAULT 'Website',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customers_phone_unique UNIQUE (phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at DESC);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS order_source TEXT NOT NULL DEFAULT 'Website';
