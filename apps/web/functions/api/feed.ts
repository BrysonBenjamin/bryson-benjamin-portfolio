type Env = {
  PUBLIC_FEED_DB: D1Database;
};

type FeedRow = {
  id: string;
  state: string;
  title: string;
  detail: string;
  tone: string;
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

export async function onRequestGet(context: { env: Env }) {
  if (!context.env.PUBLIC_FEED_DB) {
    return Response.json(
      { error: "Public feed database is not available." },
      { headers: jsonHeaders, status: 503 }
    );
  }

  const { results } = await context.env.PUBLIC_FEED_DB.prepare(
    `SELECT id, state, title, detail, tone
      FROM public_feed_items
      WHERE workspace = ? AND is_public = 1
      ORDER BY sort_order ASC, updated_at DESC
      LIMIT 12`
  )
    .bind(WORKSPACE)
    .all<FeedRow>();

  const items = (results ?? []).map((item) => ({
    ...item,
    tone: normalizeTone(item.tone)
  }));

  return Response.json(
    {
      workspace: WORKSPACE,
      source: "d1",
      generatedAt: new Date().toISOString(),
      items
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
