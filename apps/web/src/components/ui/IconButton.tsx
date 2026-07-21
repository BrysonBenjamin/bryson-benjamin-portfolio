import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

export function IconButton({ className, label, children, ...props }: IconButtonProps) {
  const classes = ["bb-icon-button", className].filter(Boolean).join(" ");

  return (
    <button aria-label={label} className={classes} title={label} {...props}>
      {children}
    </button>
  );
}
