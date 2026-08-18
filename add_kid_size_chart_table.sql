-- Migration: Create kid_size_chart table and seed all clothing size rows
-- Run this in Supabase SQL editor as an admin user

CREATE TABLE IF NOT EXISTS kid_size_chart (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    age_label VARCHAR(60) NOT NULL UNIQUE,
    min_months INTEGER NOT NULL,
    max_months INTEGER NOT NULL,
    shirt_size VARCHAR(20) NOT NULL,
    bottom_size VARCHAR(20) NOT NULL,
    weight_range VARCHAR(30),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT kid_size_chart_months_check CHECK (min_months >= 0 AND max_months >= min_months)
);

CREATE INDEX IF NOT EXISTS kid_size_chart_active_idx ON kid_size_chart(is_active);
CREATE INDEX IF NOT EXISTS kid_size_chart_month_range_idx ON kid_size_chart(min_months, max_months);
CREATE INDEX IF NOT EXISTS kid_size_chart_sort_idx ON kid_size_chart(sort_order);

INSERT INTO kid_size_chart (
    age_label,
    min_months,
    max_months,
    shirt_size,
    bottom_size,
    weight_range,
    sort_order,
    is_active
)
VALUES
    ('0-3 Months', 0, 3, '10', '11', '3-6 kg', 10, true),
    ('3-6 Months', 3, 6, '11', '11', '6-8 kg', 20, true),
    ('6-9 Months', 6, 9, '12', '12', '8-9 kg', 30, true),
    ('9-12 Months', 9, 12, '13', '14', '9-10 kg', 40, true),
    ('12-18 Months (1 Year)', 12, 18, '14', '16', '10-11 kg', 50, true),
    ('18-24 Months', 18, 24, '15', '17', '11-13 kg', 60, true),
    ('2-3 Year', 24, 36, '16', '18', '13-15 kg', 70, true),
    ('3-4 Year', 36, 48, '17', '20', '15-17 kg', 80, true),
    ('4-5 Year', 48, 60, '18', '22', '17-19 kg', 90, true),
    ('5-6 Year', 60, 72, '19', '24', '19-21 kg', 100, true),
    ('6-7 Year', 72, 84, '20', '26', '21-23 kg', 110, true),
    ('7-8 Year', 84, 96, '21/22', '28/30', '23-27 kg', 120, true),
    ('9-10 Year', 108, 120, '23/24', '32', '27-32 kg', 130, true)
ON CONFLICT (age_label) DO UPDATE
SET min_months = EXCLUDED.min_months,
    max_months = EXCLUDED.max_months,
    shirt_size = EXCLUDED.shirt_size,
    bottom_size = EXCLUDED.bottom_size,
    weight_range = EXCLUDED.weight_range,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
