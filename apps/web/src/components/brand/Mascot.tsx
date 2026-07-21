import type { CSSProperties } from "react";
import mascotImage from "../../assets/mascot.png";

type MascotProps = {
  alt?: string;
  decorative?: boolean;
  flip?: boolean;
  hop?: boolean;
  size?: number;
  speech?: string;
  style?: CSSProperties;
};

type MascotStyle = CSSProperties & {
  "--mascot-size": string;
};

export function Mascot({
  alt = "8-bit lion mascot",
  decorative = false,
  flip,
  hop,
  size = 112,
  speech,
  style
}: MascotProps) {
  const classes = [
    "bb-mascot",
    flip ? "bb-mascot--flip" : undefined,
    hop ? "bb-mascot--hop" : undefined
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} style={{ "--mascot-size": `${size}px`, ...style } as MascotStyle}>
      {speech ? <span className="bb-mascot__speech">{speech}</span> : null}
      <img
        alt={decorative ? "" : alt}
        aria-hidden={decorative ? "true" : undefined}
        className="bb-mascot__image"
        src={mascotImage}
      />
    </span>
  );
}
