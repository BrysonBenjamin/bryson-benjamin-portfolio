import type { HTMLAttributes, ReactNode } from "react";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  eyebrow?: string;
};

export function Section({ children, className, eyebrow, ...props }: SectionProps) {
  const classes = ["section", className].filter(Boolean).join(" ");

  return (
    <section className={classes} {...props}>
      {eyebrow ? <p className="section__eyebrow">{eyebrow}</p> : null}
      {children}
    </section>
  );
}
