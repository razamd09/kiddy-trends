-- Event log table for website funnel analytics.

CREATE TABLE IF NOT EXISTS website_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  path TEXT,
  product_id TEXT,
  order_number TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_analytics_events_created_at
ON website_analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_analytics_events_event_name
ON website_analytics_events(event_name);

CREATE INDEX IF NOT EXISTS idx_website_analytics_events_session_id
ON website_analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_website_analytics_events_path
ON website_analytics_events(path);
