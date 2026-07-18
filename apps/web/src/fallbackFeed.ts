import type { FeedDetail, FeedItem } from "./types";

export const fallbackFeedItems: FeedItem[] = [
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

export function fallbackFeedDetail(id: string): FeedDetail | null {
  const item = fallbackFeedItems.find((entry) => entry.id === id);
  return item ? { ...item, body: item.detail, links: [] } : null;
}
