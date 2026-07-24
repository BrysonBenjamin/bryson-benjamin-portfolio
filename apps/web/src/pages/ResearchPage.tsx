import { useEffect } from "react";
import { Database, Download, FileText, TrendingDown, Users } from "lucide-react";
import { Section } from "../components/layout/Section";
import { StaggeredGrid } from "../components/layout/Asymmetric";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { researchPaper, researchPillars, researchStats } from "../content/research";

const statIcons = [Database, TrendingDown, Users];

function ResearchPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${researchPaper.title} — Bryson Benjamin`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <>
      <Section className="research-hero">
        <p className="section__eyebrow">Research</p>
        <h1 id="page-title">{researchPaper.title}</h1>
        <p className="research-byline">
          {researchPaper.author} · {researchPaper.degreeLine} · {researchPaper.date}
        </p>
        <p className="research-lead">{researchPaper.lead}</p>
        <div className="research-hero__actions">
          <a
            className="bb-button bb-button--lg bb-button--primary"
            href={researchPaper.pdfPath}
            target="_blank"
            rel="noreferrer noopener"
          >
            Read the PDF
            <FileText size={18} aria-hidden="true" />
          </a>
          <a
            className="bb-button bb-button--lg bb-button--secondary"
            href={researchPaper.pdfPath}
            download={researchPaper.pdfDownloadName}
          >
            Download PDF
            <Download size={18} aria-hidden="true" />
          </a>
        </div>
      </Section>

      <Section className="research-section" eyebrow="Abstract" id="abstract">
        <div className="section-heading">
          <h2>The short version</h2>
          <p>What the paper argues, in one paragraph.</p>
        </div>
        <Card className="research-abstract-card">
          <p>{researchPaper.abstract}</p>
        </Card>
        <div className="research-keywords">
          <span className="research-keywords__label">Key words</span>
          <div className="tag-row">
            {researchPaper.keywords.map((keyword) => (
              <Tag key={keyword}>{keyword}</Tag>
            ))}
          </div>
        </div>
      </Section>

      <Section className="research-section" eyebrow="By the numbers" id="findings">
        <div className="section-heading">
          <h2>What the data says</h2>
          <p>Headline figures from the full regression analysis.</p>
        </div>
        <StaggeredGrid className="status-grid" variant="compact">
          {researchStats.map((stat, index) => {
            const Icon = statIcons[index] ?? Database;
            return (
              <Card className="status-card research-stat-card" key={stat.label} sunken>
                <Icon size={18} aria-hidden="true" />
                <div>
                  <strong>{stat.value}</strong>
                  <p>{stat.label}</p>
                  <span className="research-stat-card__meta">{stat.meta}</span>
                </div>
              </Card>
            );
          })}
        </StaggeredGrid>
      </Section>

      <Section className="research-section" eyebrow="Background" id="background">
        <div className="section-heading">
          <h2>Why I wrote this</h2>
          <p>Where the paper sits inside my economics and data science coursework.</p>
        </div>
        <div className="research-pillars">
          {researchPillars.map((pillar) => (
            <Card className="research-pillar-card" key={pillar.title}>
              <span className="research-pillar-card__tag">{pillar.tag}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </Card>
          ))}
        </div>
        <Card className="research-coursework-card" sunken>
          <p className="research-coursework-card__label">
            {researchPaper.degreeLine} · New York University & NYU Shanghai · 2021–2025
          </p>
          <div className="tag-row">
            {researchPaper.coursework.map((course) => (
              <Tag key={course}>{course}</Tag>
            ))}
          </div>
        </Card>
      </Section>

      <Section className="research-section research-read-section" eyebrow="Read it" id="read">
        <div className="section-heading">
          <h2>The full paper</h2>
          <p>29 pages, including model specification, robustness checks, and appendix tables.</p>
        </div>
        <div className="research-viewer">
          <iframe src={researchPaper.pdfPath} title={`${researchPaper.title} — full paper PDF`} loading="lazy" />
        </div>
        <p className="research-viewer__fallback">
          Preview not loading, or reading on a phone?{" "}
          <a href={researchPaper.pdfPath} target="_blank" rel="noreferrer noopener">
            Open the PDF in a new tab
          </a>{" "}
          instead.
        </p>
        <p className="research-citation">{researchPaper.citation}</p>
      </Section>
    </>
  );
}

export default ResearchPage;
