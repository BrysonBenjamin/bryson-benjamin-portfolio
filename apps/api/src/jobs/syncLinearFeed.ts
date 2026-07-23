const LINEAR_API_URL = "https://api.linear.app/graphql";

type LinearAttachment = {
  title: string;
  url: string;
};

type LinearIssue = {
  identifier: string;
  title: string;
  description: string | null;
  updatedAt: string;
  completedAt: string | null;
  state: { name: string; type: string };
  attachments: { nodes: LinearAttachment[] };
  parent: { identifier: string } | null;
};

type LinearIssuesResponse = {
  data?: {
    issues: {
      nodes: LinearIssue[];
    };
  };
  errors?: { message: string }[];
};

type SyncConfig = {
  linearApiKey: string;
  teamKeys: string[];
  publicLabels: string[];
  workspace: string;
  completedGraceDays: number;
  cloudflareApiToken: string;
  cloudflareAccountId: string;
  cloudflareDatabaseId: string;
};

const toneByStateType: Record<string, string> = {
  backlog: "blue",
  unstarted: "blue",
  started: "amber",
  completed: "mint"
};

function readConfig(): SyncConfig | null {
  const linearApiKey = Bun.env.LINEAR_API_KEY;
  const teamKeys = (Bun.env.LINEAR_TEAM_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  const publicLabels = (Bun.env.LINEAR_PUBLIC_LABELS ?? "public-feed")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
  const workspace = Bun.env.PUBLIC_WORKSPACE_KEY ?? "brysonbenjamin";
  const completedGraceDays = Number(Bun.env.LINEAR_COMPLETED_GRACE_DAYS ?? "3");
  const cloudflareApiToken = Bun.env.CLOUDFLARE_API_TOKEN;
  const cloudflareAccountId = Bun.env.CLOUDFLARE_ACCOUNT_ID;
  const cloudflareDatabaseId = Bun.env.CLOUDFLARE_D1_DATABASE_ID;

  if (
    !linearApiKey ||
    teamKeys.length === 0 ||
    publicLabels.length === 0 ||
    !cloudflareApiToken ||
    !cloudflareAccountId ||
    !cloudflareDatabaseId
  ) {
    return null;
  }

  return {
    linearApiKey,
    teamKeys,
    publicLabels,
    workspace,
    completedGraceDays: Number.isFinite(completedGraceDays) ? completedGraceDays : 3,
    cloudflareApiToken,
    cloudflareAccountId,
    cloudflareDatabaseId
  };
}

function isWithinCompletedGrace(issue: LinearIssue, graceDays: number): boolean {
  if (issue.state.type !== "completed") {
    return true;
  }

  if (!issue.completedAt) {
    return true;
  }

  const cutoff = Date.now() - graceDays * 24 * 60 * 60 * 1000;
  return new Date(issue.completedAt).getTime() >= cutoff;
}

async function fetchPublicIssues(config: SyncConfig): Promise<LinearIssue[]> {
  const query = /* GraphQL */ `
    query PublicFeedIssues($teamKeys: [String!], $labels: [String!]) {
      issues(
        first: 50
        orderBy: updatedAt
        filter: {
          team: { key: { in: $teamKeys } }
          labels: { name: { in: $labels } }
          state: { type: { nin: ["canceled"] } }
        }
      ) {
        nodes {
          identifier
          title
          description
          updatedAt
          completedAt
          state {
            name
            type
          }
          attachments {
            nodes {
              title
              url
            }
          }
          parent {
            identifier
          }
        }
      }
    }
  `;

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.linearApiKey
    },
    body: JSON.stringify({
      query,
      variables: { teamKeys: config.teamKeys, labels: config.publicLabels }
    })
  });

  const remaining = response.headers.get("X-RateLimit-Requests-Remaining");
  if (remaining !== null && Number(remaining) < 50) {
    console.warn(`linear feed sync: rate limit budget low (${remaining} requests remaining)`);
  }

  if (response.status === 429) {
    throw new Error("linear feed sync: rate limited by Linear, stopping this run cleanly");
  }

  if (!response.ok) {
    throw new Error(`linear feed sync: Linear API request failed with ${response.status}`);
  }

  const payload = (await response.json()) as LinearIssuesResponse;

  if (payload.errors?.length) {
    throw new Error(`linear feed sync: ${payload.errors.map((error) => error.message).join(", ")}`);
  }

  return payload.data?.issues.nodes ?? [];
}

function toDetail(description: string | null): string {
  if (!description) {
    return "";
  }

  const firstParagraph = description.split(/\n\s*\n/)[0]?.trim() ?? "";
  return firstParagraph.length > 180 ? `${firstParagraph.slice(0, 177)}...` : firstParagraph;
}

async function upsertToD1(config: SyncConfig, issues: LinearIssue[]) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/d1/database/${config.cloudflareDatabaseId}/query`;
  const activeIds = new Set(issues.map((issue) => issue.identifier));

  for (const [index, issue] of issues.entries()) {
    const detail = toDetail(issue.description);
    const body = issue.description?.trim() || detail;
    const links = issue.attachments.nodes.map((attachment) => ({
      label: attachment.title,
      url: attachment.url
    }));
    // Only keep the parent link if the parent is also in this run's gated
    // set — otherwise it'd point at a page that doesn't exist publicly.
    const parentId = issue.parent && activeIds.has(issue.parent.identifier) ? issue.parent.identifier : null;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.cloudflareApiToken}`
      },
      body: JSON.stringify({
        sql: `INSERT INTO public_feed_items
            (id, workspace, source, source_id, state, title, detail, body, links_json, tone, sort_order, is_public, parent_id, updated_at)
          VALUES (?, ?, 'linear', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            workspace = excluded.workspace,
            source = excluded.source,
            source_id = excluded.source_id,
            state = excluded.state,
            title = excluded.title,
            detail = excluded.detail,
            body = excluded.body,
            links_json = excluded.links_json,
            tone = excluded.tone,
            sort_order = excluded.sort_order,
            is_public = excluded.is_public,
            parent_id = excluded.parent_id,
            updated_at = excluded.updated_at`,
        params: [
          issue.identifier,
          config.workspace,
          issue.identifier,
          issue.state.name,
          issue.title,
          detail,
          body,
          JSON.stringify(links),
          toneByStateType[issue.state.type] ?? "white",
          index,
          parentId,
          issue.updatedAt
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`linear feed sync: D1 upsert failed for ${issue.identifier} with ${response.status}`);
    }
  }
}

async function pruneStaleRows(config: SyncConfig, currentIds: string[]) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/d1/database/${config.cloudflareDatabaseId}/query`;

  const sql =
    currentIds.length > 0
      ? `DELETE FROM public_feed_items WHERE workspace = ? AND source = 'linear' AND id NOT IN (${currentIds.map(() => "?").join(", ")})`
      : `DELETE FROM public_feed_items WHERE workspace = ? AND source = 'linear'`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.cloudflareApiToken}`
    },
    body: JSON.stringify({ sql, params: [config.workspace, ...currentIds] })
  });

  if (!response.ok) {
    throw new Error(`linear feed sync: D1 prune failed with ${response.status}`);
  }

  const payload = (await response.json()) as { result?: { meta?: { changes?: number } }[] };
  const removed = payload.result?.[0]?.meta?.changes ?? 0;

  if (removed > 0) {
    console.log(`linear feed sync: pruned ${removed} row(s) no longer public (unlabeled, canceled, deleted, or past the completed grace period)`);
  }
}

// One-time cleanup of the hand-written seed rows that predate this sync job.
// Safe to leave in permanently (deletes 0 rows once they're gone), but can be
// removed in a follow-up once confirmed.
const LEGACY_MANUAL_SEED_IDS = ["BB-01", "BB-02", "BB-03", "BB-04"];

async function removeLegacyManualSeed(config: SyncConfig) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/d1/database/${config.cloudflareDatabaseId}/query`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.cloudflareApiToken}`
    },
    body: JSON.stringify({
      sql: `DELETE FROM public_feed_items WHERE workspace = ? AND id IN (${LEGACY_MANUAL_SEED_IDS.map(() => "?").join(", ")})`,
      params: [config.workspace, ...LEGACY_MANUAL_SEED_IDS]
    })
  });

  if (!response.ok) {
    throw new Error(`linear feed sync: legacy seed cleanup failed with ${response.status}`);
  }

  const payload = (await response.json()) as { result?: { meta?: { changes?: number } }[] };
  const removed = payload.result?.[0]?.meta?.changes ?? 0;

  if (removed > 0) {
    console.log(`linear feed sync: removed ${removed} legacy manual seed row(s) (BB-01..04)`);
  }
}

async function main() {
  const config = readConfig();

  if (!config) {
    console.log("linear feed sync: missing LINEAR_API_KEY, LINEAR_TEAM_KEYS, or Cloudflare env vars, no-op");
    return;
  }

  await removeLegacyManualSeed(config);

  const fetchedIssues = await fetchPublicIssues(config);
  const activeIssues = fetchedIssues.filter((issue) => isWithinCompletedGrace(issue, config.completedGraceDays));
  console.log(
    `linear feed sync: found ${fetchedIssues.length} public-feed issue(s), ${activeIssues.length} still within the completed grace period`
  );

  await upsertToD1(config, activeIssues);
  await pruneStaleRows(config, activeIssues.map((issue) => issue.identifier));
  console.log("linear feed sync: done");
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { main as syncLinearFeed };
