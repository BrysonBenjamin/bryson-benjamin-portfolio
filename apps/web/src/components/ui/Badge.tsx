import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone = "accent" | "moss" | "fjord" | "sand" | "danger" | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  dot?: boolean;
  tone?: BadgeTone;
};

export function Badge({ children, className, dot, tone = "accent", ...props }: BadgeProps) {
  const classes = ["bb-badge", `bb-badge--${tone}`, className].filter(Boolean).join(" ");

  return (
    <span className={classes} {...props}>
      {dot ? <span className="bb-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
