-- Migration: Create shipping_rates table
-- Run this in Supabase SQL editor as an admin user

CREATE TABLE IF NOT EXISTS shipping_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    flat_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping_percentage DECIMAL(6, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS shipping_rates_active_idx ON shipping_rates(is_active);
CREATE INDEX IF NOT EXISTS shipping_rates_updated_idx ON shipping_rates(updated_at DESC);

-- Ensure only one active rate by default after migration
UPDATE shipping_rates
SET is_active = false
WHERE id NOT IN (
    SELECT id
    FROM shipping_rates
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 1
);
