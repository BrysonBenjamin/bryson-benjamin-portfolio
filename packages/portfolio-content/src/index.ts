export type PublicProject = {
  id: string;
  badge: {
    label: string;
    tone: "accent" | "moss" | "fjord";
  };
  description: string;
  name: string;
  tags: readonly string[];
  year: string;
};

export type PublicPost = {
  date: string;
  minutes: number;
  teaser: string;
  title: string;
};

export type PublicStatusNote = {
  label: string;
  value: string;
};

export const publicProfile = {
  name: "Bryson Benjamin",
  domain: "brysonbenjamin.com",
  role: "Product manager / full-stack engineer",
  summary:
    "Bryson builds product systems and full-stack tools, keeping product strategy close to implementation.",
  contact: {
    emailHref: "mailto:hello@brysonbenjamin.com",
    githubHref: "https://github.com/BrysonBenjamin"
  }
} as const;

export const publicProjects: readonly PublicProject[] = [
  {
    id: "portfolio",
    badge: { label: "Featured", tone: "accent" },
    description: "A public operating surface that turns product planning, docs, and build logs into a working portfolio.",
    name: "Bryson Benjamin portfolio",
    tags: ["React", "Cloudflare", "Hono", "Drizzle"],
    year: "2026"
  },
  {
    id: "linear-feed-bridge",
    badge: { label: "Live", tone: "moss" },
    description: "A label-gated Linear mirror that keeps the public site honest without publishing private workspace data.",
    name: "Linear feed bridge",
    tags: ["Linear", "D1", "Bun"],
    year: "2026"
  },
  {
    id: "design-system",
    badge: { label: "Prototype", tone: "fjord" },
    description: "A small design language built around warm systems thinking, plainspoken copy, and an 8-bit lion mascot.",
    name: "Personal design system",
    tags: ["Design systems", "TypeScript", "CSS"],
    year: "2026"
  }
];

export const publicPosts: readonly PublicPost[] = [
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

export const publicStatusNotes: readonly PublicStatusNote[] = [
  { label: "Focus", value: "Product systems and full-stack tools" },
  { label: "Stack", value: "TypeScript, React, Hono, Postgres" },
  { label: "Now", value: "Revamping the site design system" }
];
