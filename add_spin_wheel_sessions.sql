-- Server-enforced daily spin sessions for Independence Day wheel
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists spin_wheel_sessions (
  id uuid primary key default gen_random_uuid(),
  day_key date not null,
  fingerprint_hash text not null,
  user_agent_hash text not null,
  ip_hash text,
  spins_used integer not null default 0 check (spins_used >= 0 and spins_used <= 2),
  active_discount integer not null default 0 check (active_discount in (0, 10, 20)),
  discount_code text,
  consumed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_spin_at timestamptz
);

create unique index if not exists spin_wheel_sessions_unique_day_device
  on spin_wheel_sessions (day_key, fingerprint_hash, user_agent_hash);

create index if not exists spin_wheel_sessions_day_idx
  on spin_wheel_sessions (day_key desc, updated_at desc);
