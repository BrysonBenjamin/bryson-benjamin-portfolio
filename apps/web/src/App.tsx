import { Code2, Cpu, Mail, Radio, TerminalSquare } from "lucide-react";

const statusItems = [
  { label: "Frontend", value: "Vite SPA online" },
  { label: "Runtime", value: "Bun + Hono warming" },
  { label: "Storage", value: "Neon schema staged" }
];

const consoleLines = [
  "$ systemctl start brysonbenjamin.com",
  "loading interface primitives...",
  "calibrating signal, memory, and craft...",
  "status: under construction"
];

function App() {
  return (
    <main className="construction-shell" aria-labelledby="page-title">
      <div className="ambient-grid" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="/" aria-label="Bryson Benjamin home">
          <span className="brand-mark">BB</span>
          <span>brysonbenjamin.com</span>
        </a>
        <a className="contact-link" href="mailto:hello@brysonbenjamin.com">
          <Mail size={17} aria-hidden="true" />
          <span>hello@brysonbenjamin.com</span>
        </a>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <Radio size={15} aria-hidden="true" />
            Signal active
          </p>
          <h1 id="page-title">This site is currently under construction.</h1>
          <p className="hero-text">
            I am building the system in the open: a personal operating surface for software,
            writing, research, and the connective tissue between them. The lights are on. The
            machinery is still settling.
          </p>
        </div>

        <aside className="console-panel" aria-label="Current system status">
          <div className="console-topbar">
            <div className="window-controls" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span>bootstrap.log</span>
          </div>
          <div className="console-body">
            {consoleLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </aside>
      </section>

      <section className="status-row" aria-label="Build status">
        {statusItems.map((item) => (
          <article className="status-item" key={item.label}>
            <div className="status-icon">
              {item.label === "Frontend" && <Code2 size={18} aria-hidden="true" />}
              {item.label === "Runtime" && <Cpu size={18} aria-hidden="true" />}
              {item.label === "Storage" && <TerminalSquare size={18} aria-hidden="true" />}
            </div>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
