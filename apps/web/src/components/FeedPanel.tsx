import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useFeed } from "../hooks/useFeed";

function FeedPanel() {
  const { feedItems, feedSource } = useFeed();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

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
      <div className="feed-stack">
        <AnimatePresence initial={false}>
          {feedItems.map((item) => (
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
