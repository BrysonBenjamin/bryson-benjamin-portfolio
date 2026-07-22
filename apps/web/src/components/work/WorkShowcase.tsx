import { ArrowRight } from "lucide-react";
import type { Project } from "../../content/home";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";

type WorkShowcaseProps = {
  projects: readonly Project[];
};

const proofPoints = [
  { label: "role", value: "PM + build" },
  { label: "surface", value: "public operating system" },
  { label: "proof", value: "docs, feed, deploys" }
];

const flowSteps = ["roadmap", "issues", "docs", "release"];

function ProjectBody({ project }: { project: Project }) {
  return (
    <>
      <div className="project-card__meta">
        <Badge dot={project.badge.tone === "moss"} tone={project.badge.tone}>
          {project.badge.label}
        </Badge>
        <span>{project.year}</span>
      </div>
      <div>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
      </div>
      <div className="tag-row">
        {project.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </>
  );
}

export function WorkShowcase({ projects }: WorkShowcaseProps) {
  const [featured, bridge, system] = projects;

  if (!featured) {
    return null;
  }

  return (
    <div className="work-showcase">
      <div className="work-showcase__metric" aria-hidden="true">
        <span>bb-work / 2026</span>
        <span>public proof line</span>
      </div>

      <div className="work-current" aria-hidden="true">
        {flowSteps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>

      <Card className="project-card project-card--feature" variant="joint">
        <ProjectBody project={featured} />
        <dl className="project-proof-list">
          {proofPoints.map((point) => (
            <div key={point.label}>
              <dt>{point.label}</dt>
              <dd>{point.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {bridge ? (
        <Card className="project-card project-card--bridge" variant="notch">
          <ProjectBody project={bridge} />
        </Card>
      ) : null}

      {system ? (
        <Card className="project-card project-card--system">
          <ProjectBody project={system} />
        </Card>
      ) : null}

      <Card className="work-inspector" variant="shoji">
        <div className="work-inspector__label">why this belongs here</div>
        <p>
          Each project has to carry its own receipt: the decision trail, the shipped
          surface, and a public note when the work can be shown.
        </p>
        <a className="work-inspector__link" href="#build-log">
          Follow the build log
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </Card>

      <div className="work-showcase__signature" aria-hidden="true">
        <span>scope</span>
        <strong>strategy / interface / shipped system</strong>
      </div>
    </div>
  );
}
