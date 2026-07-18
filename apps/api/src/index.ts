import { contactMessages, createDb } from "@bryson-benjamin/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

const app = new Hono();
const port = Number(Bun.env.PORT ?? 8787);
const databaseUrl = Bun.env.DATABASE_URL;
const db = databaseUrl ? createDb(databaseUrl) : null;
const allowedOrigins = (Bun.env.CORS_ORIGIN ?? "http://localhost:5173,https://brysonbenjamin.com")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(3000)
});

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) {
        return allowedOrigins[0] ?? "*";
      }

      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? origin;
    },
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"]
  })
);

app.get("/", (context) =>
  context.json({
    name: "bryson-benjamin-portfolio-api",
    health: "/health"
  })
);

app.get("/health", (context) =>
  context.json({
    status: "ok",
    service: "portfolio-api",
    database: databaseUrl ? "configured" : "missing"
  })
);

app.get("/api/profile", (context) =>
  context.json({
    name: "Bryson Benjamin",
    domain: "brysonbenjamin.com",
    stack: ["Vite", "Bun", "Hono", "Drizzle", "Neon", "Cloudflare Pages", "Railway"]
  })
);

app.post("/api/contact", async (context) => {
  const json = await context.req.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);

  if (!parsed.success) {
    return context.json(
      {
        error: "Invalid request",
        issues: parsed.error.flatten()
      },
      400
    );
  }

  if (!db) {
    return context.json(
      {
        error: "DATABASE_URL is not configured"
      },
      503
    );
  }

  const [message] = await db
    .insert(contactMessages)
    .values(parsed.data)
    .returning({
      id: contactMessages.id,
      createdAt: contactMessages.createdAt
    });

  return context.json({ ok: true, message }, 201);
});

console.log(`Portfolio API listening on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  port
});

