import type { BadgeTone } from "../components/ui/Badge";

export type Project = {
  badge: {
    label: string;
    tone: BadgeTone;
  };
  description: string;
  name: string;
  tags: string[];
  year: string;
};

export type Post = {
  date: string;
  minutes: number;
  teaser: string;
  title: string;
};

export type StatusNote = {
  label: string;
  value: string;
};

export const projects: Project[] = [
  {
    badge: { label: "Featured", tone: "accent" },
    description: "A public operating surface that turns product planning, docs, and build logs into a working portfolio.",
    name: "Bryson Benjamin portfolio",
    tags: ["React", "Cloudflare", "Hono", "Drizzle"],
    year: "2026"
  },
  {
    badge: { label: "Live", tone: "moss" },
    description: "A label-gated Linear mirror that keeps the public site honest without publishing private workspace data.",
    name: "Linear feed bridge",
    tags: ["Linear", "D1", "Bun"],
    year: "2026"
  },
  {
    badge: { label: "Prototype", tone: "fjord" },
    description: "A small design language built around warm systems thinking, plainspoken copy, and an 8-bit lion mascot.",
    name: "Personal design system",
    tags: ["Design systems", "TypeScript", "CSS"],
    year: "2026"
  }
];

export const posts: Post[] = [
  {
    date: "Jul 2026",
    minutes: 5,
    teaser: "What changes when the portfolio becomes the product, not just a page that points elsewhere.",
    title: "Building the operating surface"
  },
  {
    date: "Jul 2026",
    minutes: 4,
    teaser: "Why I am treating public docs, issue mirrors, and implementation notes as the same product story.",
    title: "Docs as proof of work"
  },
  {
    date: "Jun 2026",
    minutes: 6,
    teaser: "A short note on keeping a build log useful without turning the private workspace into public content.",
    title: "Shipping in public, carefully"
  }
];

export const statusNotes: StatusNote[] = [
  { label: "Focus", value: "Product systems and full-stack tools" },
  { label: "Stack", value: "TypeScript, React, Hono, Postgres" },
  { label: "Now", value: "Revamping the site design system" }
];
