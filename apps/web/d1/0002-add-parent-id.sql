-- One-time migration for the already-deployed brysonbenjamin-public D1 database.
-- Adds sub-issue support: a row's parent_id points back to another row's id
-- when the parent issue is also in the gated public-feed set.
-- Run once: wrangler d1 execute brysonbenjamin-public --remote --file=apps/web/d1/0002-add-parent-id.sql

ALTER TABLE public_feed_items ADD COLUMN parent_id TEXT REFERENCES public_feed_items (id);

CREATE INDEX IF NOT EXISTS idx_public_feed_items_parent
  ON public_feed_items (parent_id);
