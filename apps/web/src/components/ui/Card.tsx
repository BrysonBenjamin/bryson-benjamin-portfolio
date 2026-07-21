import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  interactive?: boolean;
  sunken?: boolean;
  variant?: "joint" | "notch" | "shoji";
};

export function Card({ children, className, interactive, sunken, variant, ...props }: CardProps) {
  const classes = [
    "bb-card",
    interactive ? "bb-card--interactive" : undefined,
    sunken ? "bb-card--sunken" : undefined,
    variant ? `bb-card--${variant}` : undefined,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {variant === "shoji" ? <div className="bb-card__shoji-inner">{children}</div> : children}
    </div>
  );
}
