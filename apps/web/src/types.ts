export type FeedTone = "mint" | "amber" | "white" | "blue";

export type FeedItem = {
  id: string;
  state: string;
  title: string;
  detail: string;
  tone: FeedTone;
};

export type FeedLink = {
  label: string;
  url: string;
};

export type FeedDetail = FeedItem & {
  body: string;
  links: FeedLink[];
};

const feedToneSet = new Set<string>(["mint", "amber", "white", "blue"]);

export function isFeedTone(value: unknown): value is FeedTone {
  return typeof value === "string" && feedToneSet.has(value);
}

export function isFeedItem(value: unknown): value is FeedItem {
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

function isFeedLink(value: unknown): value is FeedLink {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.label === "string" && typeof candidate.url === "string";
}

export function isFeedDetail(value: unknown): value is FeedDetail {
  if (!isFeedItem(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.body === "string" && Array.isArray(candidate.links) && candidate.links.every(isFeedLink);
}
