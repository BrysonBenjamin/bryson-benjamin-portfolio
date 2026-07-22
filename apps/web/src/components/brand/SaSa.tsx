import { useEffect, useMemo, useState, type CSSProperties } from "react";
import blinkImage from "../../assets/sa-sa/sa-sa-blink.png";
import lookLeftImage from "../../assets/sa-sa/sa-sa-look-left.png";
import lookRightImage from "../../assets/sa-sa/sa-sa-look-right.png";
import {
  isSaSaSequenceLayer,
  validateSaSaAssetManifest,
  type SaSaState
} from "./saSaAssets";
import { pixelAssetRenderer } from "../../features/sa-sa/renderer";

export type { SaSaState } from "./saSaAssets";

type SaSaProps = {
  alt?: string;
  animate?: boolean;
  blink?: boolean;
  decorative?: boolean;
  eyes?: "center" | "left" | "right";
  facing?: "left" | "right";
  size?: number;
  state?: SaSaState;
  style?: CSSProperties;
};

type SaSaStyle = CSSProperties & {
  "--sa-sa-size": string;
};

export function SaSa({
  alt = "Sa-Sa, the 8-bit lion mascot",
  animate = true,
  blink = false,
  decorative = false,
  eyes = "center",
  facing = "right",
  size = 100,
  state = "idle",
  style
}: SaSaProps) {
  const [tailFrame, setTailFrame] = useState(0);
  const [assetFailed, setAssetFailed] = useState(false);
  const { behavior: resolvedState, descriptor } = pixelAssetRenderer.resolve({ behavior: state, failed: assetFailed });
  const ambientEyeImage =
    resolvedState === "idle"
      ? blink
        ? blinkImage
        : eyes === "left"
          ? lookLeftImage
          : eyes === "right"
            ? lookRightImage
            : null
      : null;
  const sequenceLayer = useMemo(
    () => descriptor.layers.find(isSaSaSequenceLayer),
    [descriptor.layers]
  );

  useEffect(() => {
    setAssetFailed(false);
  }, [state]);

  useEffect(() => {
    if (!sequenceLayer || !animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTailFrame(0);
      return;
    }

    const interval = window.setInterval(() => {
      setTailFrame((currentFrame) => (currentFrame + 1) % sequenceLayer.frames.length);
    }, sequenceLayer.intervalMs);

    return () => window.clearInterval(interval);
  }, [animate, sequenceLayer]);

  if (import.meta.env.DEV) {
    validateSaSaAssetManifest();
  }

  const classes = [
    "sa-sa",
    animate ? "sa-sa--animate" : undefined,
    facing === "left" ? "sa-sa--facing-left" : undefined
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : alt}
      className={classes}
      role={decorative ? undefined : "img"}
      style={{ "--sa-sa-size": `${size}px`, ...style } as SaSaStyle}
    >
      {descriptor.layers.map((layer) => {
        const image = isSaSaSequenceLayer(layer) ? layer.frames[tailFrame] : layer.image;
        const animationClass = !isSaSaSequenceLayer(layer) && layer.animation ? `sa-sa__layer--${layer.animation}` : undefined;

        return (
          <img
            key={layer.id}
            alt=""
            aria-hidden="true"
            className={["sa-sa__layer", animationClass].filter(Boolean).join(" ")}
            onError={() => setAssetFailed(true)}
            src={image}
          />
        );
      })}
      {ambientEyeImage ? (
        <img alt="" aria-hidden="true" className="sa-sa__layer" src={ambientEyeImage} />
      ) : null}
    </span>
  );
}
