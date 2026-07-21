import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export type ScrollStageState = {
  active: boolean;
  progress: number;
  sideVelocity: number;
  time: number;
  velocity: number;
};

type ScrollStageProps = {
  children: ReactNode | ((state: ScrollStageState) => ReactNode);
  className?: string;
  offsetSelector?: string;
  style?: CSSProperties;
  stickyOffset?: number;
  travel?: number;
};

type ScrollStageStyle = CSSProperties & {
  "--scroll-stage-height": string;
  "--scroll-stage-offset": string;
};

export function ScrollStage({
  children,
  className,
  offsetSelector,
  stickyOffset = 0,
  style,
  travel = 2
}: ScrollStageProps) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState(stickyOffset);
  const [stageState, setStageState] = useState<ScrollStageState>({
    active: false,
    progress: 0,
    sideVelocity: 0,
    time: 0,
    velocity: 0
  });

  useEffect(() => {
    if (!offsetSelector) {
      setOffset(stickyOffset);
      return undefined;
    }

    const offsetElement = document.querySelector(offsetSelector);

    function updateOffset() {
      setOffset(Math.round(offsetElement?.getBoundingClientRect().height ?? stickyOffset));
    }

    updateOffset();
    window.addEventListener("resize", updateOffset);

    const resizeObserver =
      offsetElement && "ResizeObserver" in window ? new ResizeObserver(updateOffset) : null;

    if (offsetElement) {
      resizeObserver?.observe(offsetElement);
    }

    return () => {
      window.removeEventListener("resize", updateOffset);
      resizeObserver?.disconnect();
    };
  }, [offsetSelector, stickyOffset]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0;
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let sideWheelVelocity = 0;
    let smoothedSideVelocity = 0;
    let smoothedVelocity = 0;
    const startTime = performance.now();

    function handleWheel(event: WheelEvent) {
      const wrapper = wrapperRef.current;

      if (!wrapper || Math.abs(event.deltaX) < 1) {
        return;
      }

      const rect = wrapper.getBoundingClientRect();

      if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        sideWheelVelocity += event.deltaX * 24;
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: true });

    function update(now: number) {
      const wrapper = wrapperRef.current;

      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const span = Math.max(1, wrapper.offsetHeight - viewportHeight);
        const progress = Math.min(1, Math.max(0, (offset - rect.top) / (span + offset)));
        const deltaTime = Math.max(1, now - lastTime);
        const scrollY = window.scrollY;

        smoothedVelocity = smoothedVelocity * 0.88 + ((scrollY - lastScrollY) / deltaTime) * 1000 * 0.12;
        smoothedSideVelocity = smoothedSideVelocity * 0.82 + sideWheelVelocity * 0.18;
        sideWheelVelocity *= 0.62;
        lastScrollY = scrollY;
        lastTime = now;

        setStageState({
          active: rect.top <= offset + 1 && rect.bottom >= viewportHeight - 1,
          progress,
          sideVelocity: smoothedSideVelocity,
          time: reduceMotion ? 0 : (now - startTime) / 1000,
          velocity: smoothedVelocity
        });
      }

      frameId = requestAnimationFrame(update);
    }

    frameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(frameId);
    };
  }, [offset]);

  const classes = ["scroll-stage", className].filter(Boolean).join(" ");
  const stageStyle = {
    ...style,
    "--scroll-stage-height": `${(1 + travel) * 100}vh`,
    "--scroll-stage-offset": `${offset}px`
  } as ScrollStageStyle;

  return (
    <section className={classes} ref={wrapperRef} style={stageStyle}>
      <div className="scroll-stage__sticky">
        {typeof children === "function" ? children(stageState) : children}
      </div>
    </section>
  );
}
