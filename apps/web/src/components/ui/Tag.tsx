import type { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  onRemove?: () => void;
};

export function Tag({ children, className, onRemove, ...props }: TagProps) {
  const classes = ["bb-tag", className].filter(Boolean).join(" ");

  return (
    <span className={classes} {...props}>
      {children}
      {onRemove ? (
        <button className="bb-tag__remove" aria-label="Remove" onClick={onRemove} type="button">
          <X size={10} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}
