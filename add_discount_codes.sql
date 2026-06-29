-- Migration: Create discount_codes table
-- Run this in Supabase SQL editor as an admin user

CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'amount')),
    discount_value DECIMAL(10, 2) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    expiry_type VARCHAR(20) NOT NULL CHECK (expiry_type IN ('unlimited', 'limited')),
    expiry_date TIMESTAMP NULL,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS discount_codes_code_enabled ON discount_codes(code, enabled);
CREATE INDEX IF NOT EXISTS discount_codes_enabled ON discount_codes(enabled);
CREATE INDEX IF NOT EXISTS discount_codes_expiry ON discount_codes(expiry_date);
