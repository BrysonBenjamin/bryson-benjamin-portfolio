import type { FeedDetail, FeedItem } from "./types";

export const fallbackFeedItems: FeedItem[] = [
  {
    id: "offline",
    state: "Static",
    title: "Live feed is temporarily unavailable",
    detail: "The Linear-synced feed couldn't be reached from here. Check back shortly — this page is otherwise live.",
    tone: "blue"
  }
];

export function fallbackFeedDetail(id: string): FeedDetail | null {
  const item = fallbackFeedItems.find((entry) => entry.id === id);
  return item ? { ...item, body: item.detail, links: [], parent: null, subtasks: [] } : null;
}
