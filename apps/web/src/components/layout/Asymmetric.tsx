import type { HTMLAttributes, ReactNode } from "react";

type AsymmetricVariant = "hero" | "offset" | "reverse";
type StaggeredVariant = "cards" | "compact";

type AsymmetricSectionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: AsymmetricVariant;
};

type StickyNarrativeProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  narrative: ReactNode;
};

type StaggeredGridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: StaggeredVariant;
};

export function AsymmetricSection({
  children,
  className,
  variant = "offset",
  ...props
}: AsymmetricSectionProps) {
  const classes = ["asymmetric-section", `asymmetric-section--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function StickyNarrative({ children, className, narrative, ...props }: StickyNarrativeProps) {
  const classes = ["sticky-narrative", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      <div className="sticky-narrative__copy">{narrative}</div>
      <div className="sticky-narrative__surface">{children}</div>
    </div>
  );
}

export function StaggeredGrid({
  children,
  className,
  variant = "cards",
  ...props
}: StaggeredGridProps) {
  const classes = ["staggered-grid", `staggered-grid--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
