CREATE TABLE IF NOT EXISTS public_feed_items (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  state TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'white',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  url TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_feed_items_workspace_public_sort
  ON public_feed_items (workspace, is_public, sort_order, updated_at);

INSERT INTO public_feed_items (
  id,
  workspace,
  source,
  source_id,
  state,
  title,
  detail,
  tone,
  sort_order,
  is_public,
  url,
  updated_at
) VALUES
  (
    'BB-04',
    'brysonbenjamin',
    'manual',
    NULL,
    'Live',
    'Open the public build feed',
    'D1-backed workspace entries are serving through the Pages Function at /api/feed.',
    'mint',
    10,
    1,
    NULL,
    '2026-07-18T12:00:00Z'
  ),
  (
    'BB-03',
    'brysonbenjamin',
    'manual',
    NULL,
    'In motion',
    'Shape the public operating surface',
    'Navigation, archive model, and first durable page primitives.',
    'amber',
    20,
    1,
    NULL,
    '2026-07-18T11:00:00Z'
  ),
  (
    'BB-02',
    'brysonbenjamin',
    'manual',
    NULL,
    'Shipped',
    'Bring the construction page online',
    'Cloudflare Pages, apex domain, and early system status.',
    'white',
    30,
    1,
    NULL,
    '2026-07-18T10:00:00Z'
  ),
  (
    'BB-01',
    'brysonbenjamin',
    'manual',
    NULL,
    'Seeded',
    'Lay the full-stack foundation',
    'Vite, Bun, Hono, Drizzle, Neon, Render, and Cloudflare rails.',
    'blue',
    40,
    1,
    NULL,
    '2026-07-18T09:00:00Z'
  )
ON CONFLICT(id) DO UPDATE SET
  workspace = excluded.workspace,
  source = excluded.source,
  source_id = excluded.source_id,
  state = excluded.state,
  title = excluded.title,
  detail = excluded.detail,
  tone = excluded.tone,
  sort_order = excluded.sort_order,
  is_public = excluded.is_public,
  url = excluded.url,
  updated_at = excluded.updated_at;
