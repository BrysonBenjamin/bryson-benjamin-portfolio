import { useEffect, useState } from "react";
import { Code2, Cpu, Mail, Radio, TerminalSquare } from "lucide-react";
import type { CSSProperties } from "react";

type FeedTone = "mint" | "amber" | "white" | "blue";

type FeedItem = {
  id: string;
  state: string;
  title: string;
  detail: string;
  tone: FeedTone;
};

type FeedResponse = {
  workspace: string;
  items: unknown[];
};

type FeedSource = "loading" | "live" | "fallback";
type FeedCardStyle = CSSProperties & { "--card-index": number };

const statusItems = [
  { label: "Frontend", value: "Vite SPA online" },
  { label: "Runtime", value: "Bun + Hono warming" },
  { label: "Storage", value: "D1 public feed live" }
];

const fallbackFeedItems: FeedItem[] = [
  {
    id: "BB-04",
    state: "Live",
    title: "Open the public build feed",
    detail: "D1-backed workspace entries are serving through the Pages Function at /api/feed.",
    tone: "mint"
  },
  {
    id: "BB-03",
    state: "In motion",
    title: "Shape the public operating surface",
    detail: "Navigation, archive model, and first durable page primitives.",
    tone: "amber"
  },
  {
    id: "BB-02",
    state: "Shipped",
    title: "Bring the construction page online",
    detail: "Cloudflare Pages, apex domain, and early system status.",
    tone: "white"
  },
  {
    id: "BB-01",
    state: "Seeded",
    title: "Lay the full-stack foundation",
    detail: "Vite, Bun, Hono, Drizzle, Neon, Render, and Cloudflare rails.",
    tone: "blue"
  }
];

const feedToneSet = new Set<string>(["mint", "amber", "white", "blue"]);

function isFeedTone(value: unknown): value is FeedTone {
  return typeof value === "string" && feedToneSet.has(value);
}

function isFeedItem(value: unknown): value is FeedItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.state === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.detail === "string" &&
    isFeedTone(candidate.tone)
  );
}

function App() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(fallbackFeedItems);
  const [feedSource, setFeedSource] = useState<FeedSource>("loading");

  useEffect(() => {
    let isCurrent = true;

    async function loadFeed() {
      try {
        const response = await fetch("/api/feed", {
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          throw new Error(`Feed request failed with ${response.status}`);
        }

        const data = (await response.json()) as FeedResponse;
        const publicItems = data.items.filter(isFeedItem);

        if (isCurrent && data.workspace === "brysonbenjamin" && publicItems.length > 0) {
          setFeedItems(publicItems);
          setFeedSource("live");
        }
      } catch {
        if (isCurrent) {
          setFeedSource("fallback");
        }
      }
    }

    loadFeed();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <main className="construction-shell" aria-labelledby="page-title">
      <div className="ambient-grid" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="/" aria-label="Bryson Benjamin home">
          <span className="brand-mark">BB</span>
          <span>brysonbenjamin.com</span>
        </a>
        <a className="contact-link" href="mailto:hello@brysonbenjamin.com">
          <Mail size={17} aria-hidden="true" />
          <span>hello@brysonbenjamin.com</span>
        </a>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <Radio size={15} aria-hidden="true" />
            Signal active
          </p>
          <h1 id="page-title">This site is currently under construction.</h1>
          <p className="hero-text">
            I am building the system in the open: a personal operating surface for software,
            writing, research, and the connective tissue between them. The lights are on. The
            machinery is still settling.
          </p>
        </div>

        <aside className="feed-panel" aria-label="Current build log">
          <div className="feed-topbar">
            <div>
              <span className="feed-kicker">Linear feed</span>
              <strong>System log</strong>
            </div>
            <span className={`feed-sync feed-sync-${feedSource}`}>
              {feedSource === "live" ? "db-live" : feedSource === "loading" ? "syncing" : "static-safe"}
            </span>
          </div>
          <div className="feed-stack">
            {feedItems.map((item, index) => (
              <article
                className={`feed-card tone-${item.tone}`}
                key={item.id}
                style={{ "--card-index": index } as FeedCardStyle}
              >
                <div className="feed-card-meta">
                  <span>{item.id}</span>
                  <span>{item.state}</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <div className="feed-footer">
            <span>workspace brysonbenjamin</span>
            <span>public mirror</span>
          </div>
        </aside>
      </section>

      <section className="status-row" aria-label="Build status">
        {statusItems.map((item) => (
          <article className="status-item" key={item.label}>
            <div className="status-icon">
              {item.label === "Frontend" && <Code2 size={18} aria-hidden="true" />}
              {item.label === "Runtime" && <Cpu size={18} aria-hidden="true" />}
              {item.label === "Storage" && <TerminalSquare size={18} aria-hidden="true" />}
            </div>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
