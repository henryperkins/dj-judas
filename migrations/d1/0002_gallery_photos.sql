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

-- Note: No seed data needed. The frontend uses local bundled photos as fallback
-- when the D1 gallery table is empty. Use the admin panel to upload photos to R2.
