import { app } from "./app";

const port = Number(Bun.env.PORT ?? 8787);

console.log(`Portfolio API listening on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  port
});
