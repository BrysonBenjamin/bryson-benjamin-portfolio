import { useEffect, useState } from "react";
import { fallbackFeedItems } from "../fallbackFeed";
import { isFeedItem, type FeedItem } from "../types";

type FeedResponse = {
  workspace: string;
  items: unknown[];
};

export type FeedSource = "loading" | "live" | "fallback";

export function useFeed() {
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

        if (isCurrent && data.workspace === "brysonbenjamin") {
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

  return { feedItems, feedSource };
}
