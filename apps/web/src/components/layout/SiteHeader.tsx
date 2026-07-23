import { GitBranch, Mail } from "lucide-react";
import { Mascot } from "../brand/Mascot";
import { ThemeToggle } from "../brand/ThemeToggle";

const navItems = [
  { href: "/#work", label: "Work" },
  { href: "/#writing", label: "Writing" },
  { href: "/#about", label: "About" },
  { href: "/sa-sa/playground", label: "Sa-Sa Lab" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-brand" href="/" aria-label="Bryson Benjamin home">
          <Mascot decorative size={28} />
          <span>Bryson Benjamin</span>
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-actions">
          <a
            className="bb-icon-button"
            href="https://github.com/BrysonBenjamin"
            aria-label="Bryson Benjamin on GitHub"
            title="GitHub"
          >
            <GitBranch size={18} aria-hidden="true" />
          </a>
          <ThemeToggle />
          <a
            className="bb-button bb-button--sm bb-button--secondary site-actions__mail"
            href="mailto:hello@brysonbenjamin.com"
          >
            <Mail size={16} aria-hidden="true" />
            Say hello
          </a>
        </div>
      </div>
    </header>
  );
}
