import { contactMessages, createDb } from "@bryson-benjamin/db";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { cors } from "hono/cors";

const databaseUrl = Bun.env.DATABASE_URL;
const db = databaseUrl ? createDb(databaseUrl) : null;
const allowedOrigins = (Bun.env.CORS_ORIGIN ?? "http://localhost:5173,https://brysonbenjamin.com")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100).openapi({ example: "Ada Lovelace" }),
  email: z.string().trim().email().max(255).openapi({ example: "ada@example.com" }),
  message: z.string().trim().min(10).max(3000).openapi({ example: "Loved the portfolio site!" })
});

const contactMessageSchema = z.object({
  id: z.number().int().openapi({ example: 42 }),
  createdAt: z.string().datetime().openapi({ example: "2026-07-19T00:00:00.000Z" })
});

const errorSchema = z.object({
  error: z.string(),
  issues: z.unknown().optional()
});

export const app = new OpenAPIHono({
  defaultHook: (result, context) => {
    if (!result.success) {
      return context.json(
        {
          error: "Invalid request",
          issues: result.error.flatten()
        },
        400
      );
    }
  }
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

const rootRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      description: "Service identity",
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().openapi({ example: "bryson-benjamin-portfolio-api" }),
            health: z.string().openapi({ example: "/health" })
          })
        }
      }
    }
  }
});

app.openapi(rootRoute, (context) =>
  context.json({
    name: "bryson-benjamin-portfolio-api",
    health: "/health"
  })
);

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      description: "Service health",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "ok" }),
            service: z.string().openapi({ example: "portfolio-api" }),
            database: z.enum(["configured", "missing"])
          })
        }
      }
    }
  }
});

app.openapi(healthRoute, (context) =>
  context.json({
    status: "ok",
    service: "portfolio-api",
    database: databaseUrl ? ("configured" as const) : ("missing" as const)
  })
);

const profileRoute = createRoute({
  method: "get",
  path: "/api/profile",
  responses: {
    200: {
      description: "Public profile summary",
      content: {
        "application/json": {
          schema: z.object({
            name: z.string(),
            domain: z.string(),
            stack: z.array(z.string())
          })
        }
      }
    }
  }
});

app.openapi(profileRoute, (context) =>
  context.json({
    name: "Bryson Benjamin",
    domain: "brysonbenjamin.com",
    stack: ["Vite", "Bun", "Hono", "Drizzle", "Neon", "Cloudflare Pages", "Render"]
  })
);

const contactRoute = createRoute({
  method: "post",
  path: "/api/contact",
  request: {
    body: {
      content: {
        "application/json": {
          schema: contactSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Message stored",
      content: {
        "application/json": {
          schema: z.object({
            ok: z.literal(true),
            message: contactMessageSchema
          })
        }
      }
    },
    400: {
      description: "Invalid request body",
      content: {
        "application/json": {
          schema: errorSchema
        }
      }
    },
    503: {
      description: "Database not configured",
      content: {
        "application/json": {
          schema: errorSchema
        }
      }
    }
  }
});

app.openapi(contactRoute, async (context) => {
  const body = context.req.valid("json");

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
    .values(body)
    .returning({
      id: contactMessages.id,
      createdAt: contactMessages.createdAt
    });

  return context.json(
    {
      ok: true as const,
      message: {
        id: message.id,
        createdAt: message.createdAt.toISOString()
      }
    },
    201
  );
});

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Bryson Benjamin Portfolio API",
    version: "1.0.0",
    description: "Contact form and public profile endpoints backing brysonbenjamin.com."
  }
});
