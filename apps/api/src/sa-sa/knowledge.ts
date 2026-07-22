import { publicProfile, publicProjects } from "@bryson-benjamin/portfolio-content";
import type { SaSaSourceReference, SaSaToolCall, SaSaToolId } from "@bryson-benjamin/sa-sa-contracts";

export type SaSaKnowledgeResult = {
  text: string;
  sources: readonly SaSaSourceReference[];
};

const profileSource: SaSaSourceReference = {
  id: "profile",
  title: "About Bryson",
  href: "/#about",
  freshness: "static"
};

const workSource: SaSaSourceReference = {
  id: "work",
  title: "Selected work",
  href: "/#work",
  freshness: "static"
};

function projectSource(project: (typeof publicProjects)[number]): SaSaSourceReference {
  return {
    id: `project:${project.id}`,
    title: project.name,
    href: "/#work",
    freshness: "static"
  };
}

export function runPortfolioKnowledgeTool(call: SaSaToolCall): SaSaKnowledgeResult | null {
  if (call.id === "get-profile") {
    return {
      text: `${publicProfile.name} is a ${publicProfile.role.toLowerCase()}. ${publicProfile.summary}`,
      sources: [profileSource]
    };
  }

  if (call.id === "list-projects") {
    return {
      text: publicProjects.map((project, index) => `${index + 1}. ${project.name}: ${project.description}`).join(" "),
      sources: [workSource, ...publicProjects.map(projectSource)]
    };
  }

  if (call.id === "get-project") {
    const project = publicProjects.find((candidate) => candidate.id === call.input.id);
    return project
      ? {
          text: `${project.name} (${project.year}) uses ${project.tags.join(", ")}. ${project.description}`,
          sources: [projectSource(project)]
        }
      : null;
  }

  // Build-log retrieval remains intentionally unavailable until the existing public-feed
  // endpoint is shared with this service. It never falls through to private Linear data.
  return null;
}

export function isPortfolioKnowledgeTool(tool: SaSaToolId) {
  return tool === "get-profile" || tool === "list-projects" || tool === "get-project";
}
