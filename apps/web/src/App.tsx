import {
  ArrowUpRight,
  Cloud,
  Code2,
  Database,
  Mail,
  Server,
  TerminalSquare
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Profile = {
  name: string;
  domain: string;
  stack: string[];
};

type ContactState = "idle" | "sending" | "sent" | "error";

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

const fallbackProfile: Profile = {
  name: "Bryson Benjamin",
  domain: "brysonbenjamin.com",
  stack: ["Vite", "Bun", "Hono", "Drizzle", "Neon", "Cloudflare Pages", "Railway"]
};

const projects = [
  {
    title: "Portfolio Platform",
    summary: "A personal site with a typed API, managed Postgres schema, and room for case studies."
  },
  {
    title: "Systems Workbench",
    summary: "A place to turn experiments, notes, and shipped product thinking into browsable work."
  },
  {
    title: "Contact Pipeline",
    summary: "A lightweight message path ready for Neon-backed submissions and Railway hosting."
  }
];

function App() {
  const [profile, setProfile] = useState<Profile>(fallbackProfile);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [contactState, setContactState] = useState<ContactState>("idle");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiBaseUrl}/api/profile`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Profile request failed");
        }

        return response.json() as Promise<Profile>;
      })
      .then((data) => {
        setProfile(data);
        setApiStatus("online");
      })
      .catch(() => {
        setApiStatus("offline");
      });

    return () => controller.abort();
  }, []);

  const statusLabel = useMemo(() => {
    if (apiStatus === "checking") {
      return "Checking API";
    }

    return apiStatus === "online" ? "API online" : "API offline";
  }, [apiStatus]);

  async function handleContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactState("sending");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? "")
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Contact request failed");
      }

      setContactState("sent");
      event.currentTarget.reset();
    } catch {
      setContactState("error");
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Bryson Benjamin home">
          <span className="brand-mark">BB</span>
          <span>{profile.domain}</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#stack">Stack</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Full-stack portfolio</p>
            <h1 id="hero-title">{profile.name}</h1>
            <p className="hero-text">
              Building a sharp personal home for projects, essays, experiments, and the software
              systems behind them.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="mailto:hello@brysonbenjamin.com">
                <Mail size={18} aria-hidden="true" />
                hello@brysonbenjamin.com
              </a>
              <a
                className="secondary-action"
                href="https://github.com/BrysonBenjamin/bryson-benjamin-portfolio"
                target="_blank"
                rel="noreferrer"
              >
                <Code2 size={18} aria-hidden="true" />
                GitHub
              </a>
            </div>
          </div>

          <div className="signal-board" aria-label="Deployment architecture preview">
            <div className="signal-board-header">
              <div>
                <p>Runtime</p>
                <strong>Bun + Hono</strong>
              </div>
              <span className={`status-pill ${apiStatus}`}>{statusLabel}</span>
            </div>
            <div className="signal-grid">
              <div className="signal-node accent-cyan">
                <Code2 size={22} aria-hidden="true" />
                <span>Vite SPA</span>
              </div>
              <div className="signal-node accent-yellow">
                <Cloud size={22} aria-hidden="true" />
                <span>Cloudflare</span>
              </div>
              <div className="signal-node accent-red">
                <Server size={22} aria-hidden="true" />
                <span>Railway API</span>
              </div>
              <div className="signal-node accent-green">
                <Database size={22} aria-hidden="true" />
                <span>Neon DB</span>
              </div>
            </div>
            <div className="terminal-strip">
              <TerminalSquare size={18} aria-hidden="true" />
              <span>bun run dev:web</span>
            </div>
          </div>
        </section>

        <section className="content-band" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <p className="eyebrow">Selected work</p>
            <h2 id="work-title">A foundation for shipping the public archive.</h2>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.title}>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <a href="#contact">
                  Start a thread
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="content-band stack-band" id="stack" aria-labelledby="stack-title">
          <div className="section-heading">
            <p className="eyebrow">Current stack</p>
            <h2 id="stack-title">Typed, deployable, and ready for Neon-backed data.</h2>
          </div>
          <ul className="stack-list" aria-label="Technology stack">
            {profile.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="contact-band" id="contact" aria-labelledby="contact-title">
          <div className="section-heading">
            <p className="eyebrow">Contact</p>
            <h2 id="contact-title">Send a note into the API.</h2>
          </div>
          <form className="contact-form" onSubmit={handleContact}>
            <label>
              <span>Name</span>
              <input name="name" type="text" minLength={2} maxLength={100} required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" maxLength={255} required />
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" minLength={10} maxLength={3000} rows={5} required />
            </label>
            <button type="submit" disabled={contactState === "sending"}>
              <Mail size={18} aria-hidden="true" />
              {contactState === "sending" ? "Sending" : "Send message"}
            </button>
            {contactState === "sent" && <p className="form-note success">Message saved.</p>}
            {contactState === "error" && (
              <p className="form-note error">Messages save after the database URL is configured.</p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
