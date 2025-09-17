-- D1 schema for events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  flyer_url TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  venue_name TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  latitude REAL,
  longitude REAL,
  ticket_url TEXT,
  rsvp_url TEXT,
  price_text TEXT,
  tags TEXT, -- JSON string array
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Optional seed (safe if already present)
INSERT OR IGNORE INTO events (
  id, slug, title, description, flyer_url, start_time, end_time, city, region, country, status, tags
) VALUES (
  'reunion-12-chicago-2026',
  'reunion-12-chicago-2026',
  '12th Anniversary Reunion Concert',
  'A special night with DJ Lee & The Voices of Judah celebrating 12 years of ministry.',
  '/content/flyers/reunion-12-chicago-2026.jpg',
  '2026-01-10T18:00:00-06:00',
  '2026-01-10T21:00:00-06:00',
  'Chicago','IL','US','published',
  '["concert"]'
);
