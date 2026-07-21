import { ArrowRight, CircleCheck, ExternalLink, GitBranch, Mail } from "lucide-react";
import { Mascot } from "../components/brand/Mascot";
import { RiverBuildLog } from "../components/feed/RiverBuildLog";
import { AsymmetricSection, StaggeredGrid } from "../components/layout/Asymmetric";
import { Section } from "../components/layout/Section";
import { Card } from "../components/ui/Card";
import { WorkShowcase } from "../components/work/WorkShowcase";
import { posts, projects, statusNotes } from "../content/home";

function HomePage() {
  return (
    <>
      <Section className="hero-section">
        <AsymmetricSection className="hero-layout" variant="hero">
          <div className="hero-copy">
            <p className="hero-kicker">Product manager / full-stack engineer</p>
            <h1 id="page-title">Hi, I&apos;m Bryson. I build products end to end.</h1>
            <p className="hero-text">
              From the roadmap to the last commit, I like small tools, honest changelogs,
              and systems that make the messy middle easier to see.
            </p>
            <div className="hero-actions">
              <a className="bb-button bb-button--lg bb-button--primary" href="#work">
                See the work
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className="bb-button bb-button--lg bb-button--secondary" href="mailto:hello@brysonbenjamin.com">
                Say hello
                <Mail size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="hero-mascot" aria-label="Bryson Benjamin mascot">
            <Mascot hop size={164} speech="WELCOME!" />
            <div className="hero-mascot__ground" aria-hidden="true" />
          </div>
        </AsymmetricSection>
      </Section>

      <Section className="status-section" eyebrow="Now">
        <StaggeredGrid className="status-grid" variant="compact">
          {statusNotes.map((item) => (
            <Card className="status-card" key={item.label} sunken>
              <CircleCheck size={18} aria-hidden="true" />
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            </Card>
          ))}
        </StaggeredGrid>
      </Section>

      <Section className="work-section" eyebrow="Selected work" id="work">
        <div className="section-heading">
          <h2>Systems with receipts.</h2>
          <p>Recent work that pairs product thinking with working software.</p>
        </div>

        <WorkShowcase projects={projects} />
      </Section>

      <RiverBuildLog />

      <Section className="writing-section" eyebrow="Writing" id="writing">
        <div className="section-heading">
          <h2>Notes from the bench.</h2>
          <p>Short pieces on product systems, documentation, and shipping in public.</p>
        </div>

        <div className="post-list">
          {posts.map((post) => (
            <a className="post-link" href="/" key={post.title} onClick={(event) => event.preventDefault()}>
              <span className="post-link__title">{post.title}</span>
              <span className="post-link__meta">
                {post.date} / {post.minutes} min
              </span>
              <p>{post.teaser}</p>
            </a>
          ))}
        </div>
      </Section>

      <Section className="about-section" eyebrow="About" id="about">
        <AsymmetricSection className="about-grid" variant="offset">
          <div>
            <h2>I write the ticket, then I write the code.</h2>
            <p>
              I am working toward product roles where strategy and implementation stay close.
              This site is the lab: a portfolio, a docs system, a public work log, and a place
              to keep sharpening the craft.
            </p>
          </div>
          <Card className="contact-card" sunken>
            <p>Open to APM roles, product-minded engineering work, and useful collaborations.</p>
            <div className="contact-card__actions">
              <a className="bb-button bb-button--md bb-button--primary" href="mailto:hello@brysonbenjamin.com">
                Email me
                <Mail size={17} aria-hidden="true" />
              </a>
              <a className="bb-button bb-button--md bb-button--ghost" href="https://github.com/BrysonBenjamin">
                GitHub
                <GitBranch size={17} aria-hidden="true" />
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          </Card>
        </AsymmetricSection>
      </Section>
    </>
  );
}

export default HomePage;
