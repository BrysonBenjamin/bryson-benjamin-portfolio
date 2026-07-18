import type { FeedDetail, FeedItem } from "./types";

export const fallbackFeedItems: FeedItem[] = [];

export function fallbackFeedDetail(id: string): FeedDetail | null {
  const item = fallbackFeedItems.find((entry) => entry.id === id);
  return item ? { ...item, body: item.detail, links: [] } : null;
}
