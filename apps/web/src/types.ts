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

export type FeedSummary = {
  id: string;
  state: string;
  title: string;
  tone: FeedTone;
};

export type FeedDetail = FeedItem & {
  body: string;
  links: FeedLink[];
  parent: FeedSummary | null;
  subtasks: FeedSummary[];
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

function isFeedSummary(value: unknown): value is FeedSummary {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.state === "string" &&
    typeof candidate.title === "string" &&
    isFeedTone(candidate.tone)
  );
}

export function isFeedDetail(value: unknown): value is FeedDetail {
  if (!isFeedItem(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.body === "string" &&
    Array.isArray(candidate.links) &&
    candidate.links.every(isFeedLink) &&
    (candidate.parent === null || isFeedSummary(candidate.parent)) &&
    Array.isArray(candidate.subtasks) &&
    candidate.subtasks.every(isFeedSummary)
  );
}
