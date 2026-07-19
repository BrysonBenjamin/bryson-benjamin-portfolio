import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFeed } from "../hooks/useFeed";
import type { FeedTone } from "../types";

type FeedFilter = "all" | "progress" | "done";

const FILTERS: { key: FeedFilter; label: string; tone: FeedTone | "all" }[] = [
  { key: "all", label: "All", tone: "all" },
  { key: "progress", label: "In progress", tone: "amber" },
  { key: "done", label: "Complete", tone: "mint" }
];

function FeedPanel() {
  const { feedItems, feedSource } = useFeed();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = useState<FeedFilter>("all");

  const counts = useMemo(
    () => ({
      all: feedItems.length,
      progress: feedItems.filter((item) => item.tone === "amber").length,
      done: feedItems.filter((item) => item.tone === "mint").length
    }),
    [feedItems]
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return feedItems;
    }
    const tone = filter === "progress" ? "amber" : "mint";
    return feedItems.filter((item) => item.tone === tone);
  }, [feedItems, filter]);

  return (
    <aside className="feed-panel" aria-label="Current build log">
      <div className="feed-topbar">
        <div>
          <span className="feed-kicker">Linear feed</span>
          <strong>System log</strong>
        </div>
        <span className={`feed-sync feed-sync-${feedSource}`}>
          {feedSource === "live" ? "linear-live" : feedSource === "loading" ? "syncing" : "static-safe"}
        </span>
      </div>
      <div className="feed-filter" role="tablist" aria-label="Filter tasks by status">
        {FILTERS.map((option) => {
          const isActive = filter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`feed-filter-tab${isActive ? " is-active" : ""}`}
              onClick={() => setFilter(option.key)}
            >
              {isActive && (
                <motion.span
                  className="feed-filter-tab-highlight"
                  layoutId="feed-filter-tab-highlight"
                  transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="feed-filter-tab-label">
                <span className="feed-filter-dot" data-tone={option.tone} aria-hidden="true" />
                {option.label}
                <span className="feed-filter-count">{counts[option.key]}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="feed-stack">
        {filteredItems.length === 0 && feedSource !== "loading" && (
          <p className="feed-empty">
            {feedItems.length > 0
              ? `No ${filter === "progress" ? "in-progress" : "completed"} tasks right now.`
              : feedSource === "live"
                ? "No public tasks flagged yet — check back soon."
                : "Feed temporarily unavailable."}
          </p>
        )}
        <AnimatePresence initial={false}>
          {filteredItems.map((item) => (
            <motion.article
              className={`feed-card tone-${item.tone}`}
              key={item.id}
              layout={!prefersReducedMotion}
              layoutId={`feed-card-${item.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ layout: { duration: 0.5, ease: "easeInOut" }, opacity: { duration: 0.25 } }}
            >
              <Link
                className="feed-card-link"
                to={`/log/${item.id}`}
                state={{ background: location }}
                aria-label={`Open details for ${item.title}`}
              >
                <div className="feed-card-meta">
                  <span>{item.id}</span>
                  <span>{item.state}</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
              </Link>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      <div className="feed-footer">
        <span>workspace brysonbenjamin</span>
        <span>public mirror</span>
      </div>
    </aside>
  );
}

export default FeedPanel;
