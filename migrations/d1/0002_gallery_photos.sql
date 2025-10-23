-- D1 schema for gallery photos
-- Images stored in R2, metadata in D1

CREATE TABLE IF NOT EXISTS gallery_photos (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL,              -- Key in R2 bucket (e.g., "gallery/abc-123.jpg")
  src TEXT NOT NULL,                 -- Full R2 public URL
  alt TEXT NOT NULL,
  caption TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'worship',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1,  -- 0 = draft, 1 = published
  width INTEGER,                      -- Image dimensions (optional)
  height INTEGER,
  file_size INTEGER,                  -- File size in bytes
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_gallery_published ON gallery_photos(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_photos(category);
CREATE INDEX IF NOT EXISTS idx_gallery_sort ON gallery_photos(sort_order);

-- Optional seed data (using default Unsplash images initially)
INSERT OR IGNORE INTO gallery_photos (
  id, r2_key, src, alt, caption, category, sort_order, is_published
) VALUES
  (
    'seed-1',
    'gallery/seed-1.jpg',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'Live Performance at Gary Gospel Fest',
    'Gary Gospel Fest 2024 - Main Stage Performance',
    'worship',
    1,
    1
  ),
  (
    'seed-2',
    'gallery/seed-2.jpg',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
    'Voices of Judah Choir Practice',
    'Thursday Night Rehearsal at Greater Faith Community',
    'worship',
    2,
    1
  ),
  (
    'seed-3',
    'gallery/seed-3.jpg',
    'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800',
    'Community Outreach in Gary',
    'Gary Community Outreach - Feeding the Homeless',
    'community',
    3,
    1
  ),
  (
    'seed-4',
    'gallery/seed-4.jpg',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    'Studio Recording Session',
    'Recording "I Love to Praise Him" at Chicago Studios',
    'recording',
    4,
    1
  ),
  (
    'seed-5',
    'gallery/seed-5.jpg',
    'https://images.unsplash.com/photo-1529636644619-cf0d5a34e679?w=800',
    'Sunday Morning Worship',
    'Sunday Worship Service - Victory Temple Church',
    'worship',
    5,
    1
  ),
  (
    'seed-6',
    'gallery/seed-6.jpg',
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=800',
    'Youth Choir Training',
    'Northwest Indiana Youth Choir Workshop 2024',
    'youth choir',
    6,
    1
  );
