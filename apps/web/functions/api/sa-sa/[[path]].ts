type Env = {
  SA_SA_API_URL?: string;
};

type Context = {
  env: Env;
  params: { path?: string | string[] };
  request: Request;
};

/**
 * Same-origin Pages relay for the Render-owned agent gateway.
 * The browser never learns a provider key or gains a path to arbitrary upstreams.
 */
export async function onRequest(context: Context) {
  if (!context.env.SA_SA_API_URL) {
    return Response.json({ error: "Sa-Sa's guide is not configured." }, { status: 503 });
  }

  const incoming = new URL(context.request.url);
  const upstreamBase = new URL(context.env.SA_SA_API_URL);
  const segments = Array.isArray(context.params.path)
    ? context.params.path
    : context.params.path?.split("/") ?? [];
  const path = segments.map(encodeURIComponent).join("/");
  const upstream = new URL(`/api/sa-sa/${path}`, upstreamBase);
  upstream.search = incoming.search;

  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.set("origin", incoming.origin);

  const response = await fetch(upstream, {
    method: context.request.method,
    headers,
    body: ["GET", "HEAD"].includes(context.request.method) ? undefined : context.request.body,
    redirect: "manual"
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
