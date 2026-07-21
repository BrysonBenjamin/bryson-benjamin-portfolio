import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const classes = ["bb-button", `bb-button--${variant}`, `bb-button--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...props} />;
}
