import { Code2, Cpu, Radio, TerminalSquare } from "lucide-react";
import FeedPanel from "../components/FeedPanel";

const statusItems = [
  { label: "Frontend", value: "Vite SPA online" },
  { label: "Runtime", value: "Bun + Hono warming" },
  { label: "Storage", value: "D1 public feed live" }
];

function HomePage() {
  return (
    <>
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

        <FeedPanel />
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
    </>
  );
}

export default HomePage;
