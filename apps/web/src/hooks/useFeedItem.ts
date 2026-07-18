import { useEffect, useState } from "react";
import { fallbackFeedDetail } from "../fallbackFeed";
import { isFeedDetail, type FeedDetail } from "../types";

type FeedItemResponse = {
  workspace: string;
  item: unknown;
};

export type FeedItemStatus = "loading" | "live" | "fallback" | "not-found";

export function useFeedItem(id: string | undefined) {
  const [item, setItem] = useState<FeedDetail | null>(null);
  const [status, setStatus] = useState<FeedItemStatus>("loading");

  useEffect(() => {
    if (!id) {
      setStatus("not-found");
      return;
    }

    let isCurrent = true;
    setStatus("loading");
    setItem(null);

    async function loadItem() {
      try {
        const response = await fetch(`/api/feed/${encodeURIComponent(id!)}`, {
          headers: { Accept: "application/json" }
        });

        if (response.status === 404) {
          throw new Error("not-found");
        }

        if (!response.ok) {
          throw new Error(`Feed item request failed with ${response.status}`);
        }

        const data = (await response.json()) as FeedItemResponse;

        if (isCurrent && data.workspace === "brysonbenjamin" && isFeedDetail(data.item)) {
          setItem(data.item);
          setStatus("live");
        } else if (isCurrent) {
          throw new Error("invalid-response");
        }
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        const fallback = fallbackFeedDetail(id!);
        if (fallback) {
          setItem(fallback);
          setStatus("fallback");
        } else {
          setStatus("not-found");
        }
      }
    }

    loadItem();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  return { item, status };
}
