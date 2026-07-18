CREATE TABLE IF NOT EXISTS public_feed_items (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  state TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  body TEXT,
  links_json TEXT NOT NULL DEFAULT '[]',
  tone TEXT NOT NULL DEFAULT 'white',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  url TEXT,
  parent_id TEXT REFERENCES public_feed_items (id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_feed_items_workspace_public_sort
  ON public_feed_items (workspace, is_public, sort_order, updated_at);

CREATE INDEX IF NOT EXISTS idx_public_feed_items_parent
  ON public_feed_items (parent_id);

-- No manual seed rows. Real content is written exclusively by
-- apps/api/src/jobs/syncLinearFeed.ts, scheduled via
-- .github/workflows/linear-feed-sync.yml. A fresh install starts
-- with an empty feed until that job runs.
