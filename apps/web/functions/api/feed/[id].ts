type Env = {
  PUBLIC_FEED_DB: D1Database;
};

type FeedDetailRow = {
  id: string;
  state: string;
  title: string;
  detail: string;
  body: string | null;
  links_json: string;
  tone: string;
  updated_at: string;
};

type FeedLink = {
  label: string;
  url: string;
};

const WORKSPACE = "brysonbenjamin";
const allowedTones = new Set(["mint", "amber", "white", "blue"]);
const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=60, s-maxage=120"
};

function normalizeTone(tone: string) {
  return allowedTones.has(tone) ? tone : "white";
}

function parseLinks(raw: string): FeedLink[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (link): link is FeedLink =>
        typeof link === "object" &&
        link !== null &&
        typeof (link as FeedLink).label === "string" &&
        typeof (link as FeedLink).url === "string"
    );
  } catch {
    return [];
  }
}

export async function onRequestGet(context: { env: Env; params: { id: string } }) {
  if (!context.env.PUBLIC_FEED_DB) {
    return Response.json(
      { error: "Public feed database is not available." },
      { headers: jsonHeaders, status: 503 }
    );
  }

  const row = await context.env.PUBLIC_FEED_DB.prepare(
    `SELECT id, state, title, detail, body, links_json, tone, updated_at
      FROM public_feed_items
      WHERE workspace = ? AND is_public = 1 AND id = ?
      LIMIT 1`
  )
    .bind(WORKSPACE, context.params.id)
    .first<FeedDetailRow>();

  if (!row) {
    return Response.json({ error: "Not found" }, { headers: jsonHeaders, status: 404 });
  }

  return Response.json(
    {
      workspace: WORKSPACE,
      item: {
        id: row.id,
        state: row.state,
        title: row.title,
        detail: row.detail,
        body: row.body ?? row.detail,
        links: parseLinks(row.links_json),
        tone: normalizeTone(row.tone),
        updatedAt: row.updated_at
      }
    },
    { headers: jsonHeaders }
  );
}

export function onRequestOptions() {
  return new Response(null, {
    headers: {
      ...jsonHeaders,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
  });
}
