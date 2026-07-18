-- One-time migration for the already-deployed brysonbenjamin-public D1 database.
-- CREATE TABLE IF NOT EXISTS in public-feed.sql only covers fresh installs, so
-- existing tables need these columns added explicitly.
-- Run once: wrangler d1 execute brysonbenjamin-public --remote --file=apps/web/d1/0001-add-detail-columns.sql

ALTER TABLE public_feed_items ADD COLUMN body TEXT;
ALTER TABLE public_feed_items ADD COLUMN links_json TEXT NOT NULL DEFAULT '[]';
