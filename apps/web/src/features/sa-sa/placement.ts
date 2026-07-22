import type { SaSaAnchorDefinition } from "./scenes";

export type SaSaRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type SaSaViewport = {
  width: number;
  height: number;
};

export type SaSaPlacement = {
  left: number;
  top: number;
  source: "anchor" | "viewport";
  anchorId?: string;
};

export type SaSaPlacementInput = {
  viewport: SaSaViewport;
  actor: Pick<SaSaRect, "width" | "height">;
  anchors: readonly {
    definition: SaSaAnchorDefinition;
    rect: SaSaRect;
  }[];
  safeZones?: readonly SaSaRect[];
  gutter?: number;
};

const defaultGutter = 24;

function overlaps(left: SaSaRect, right: SaSaRect) {
  return (
    left.left < right.left + right.width &&
    left.left + left.width > right.left &&
    left.top < right.top + right.height &&
    left.top + left.height > right.top
  );
}

function isVisible(rect: SaSaRect, viewport: SaSaViewport) {
  return rect.left < viewport.width && rect.left + rect.width > 0 && rect.top < viewport.height && rect.top + rect.height > 0;
}

function fits(rect: SaSaRect, viewport: SaSaViewport, gutter: number) {
  return (
    rect.left >= gutter &&
    rect.top >= gutter &&
    rect.left + rect.width <= viewport.width - gutter &&
    rect.top + rect.height <= viewport.height - gutter
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function placeAtAnchor(
  anchor: SaSaPlacementInput["anchors"][number],
  actor: Pick<SaSaRect, "width" | "height">,
  gutter: number
): SaSaRect {
  const { rect } = anchor;

  if (anchor.definition.placement === "inline-start") {
    return {
      left: rect.left - actor.width - gutter,
      top: rect.top + rect.height - actor.height,
      ...actor
    };
  }

  if (anchor.definition.placement === "block-end") {
    return {
      left: rect.left + (rect.width - actor.width) / 2,
      top: rect.top + rect.height + gutter,
      ...actor
    };
  }

  return {
    left: rect.left + rect.width + gutter,
    top: rect.top + rect.height - actor.height,
    ...actor
  };
}

function viewportFallback(viewport: SaSaViewport, actor: Pick<SaSaRect, "width" | "height">, gutter: number): SaSaPlacement {
  return {
    left: clamp(viewport.width - actor.width - gutter, gutter, Math.max(gutter, viewport.width - actor.width - gutter)),
    top: clamp(viewport.height - actor.height - gutter, gutter, Math.max(gutter, viewport.height - actor.height - gutter)),
    source: "viewport"
  };
}

/**
 * Selects the first visible, available nesting area that can contain Sa-Sa without
 * obscuring a declared safe zone. The result is viewport-relative for `position: fixed`.
 */
export function resolveSaSaPlacement({
  viewport,
  actor,
  anchors,
  safeZones = [],
  gutter = defaultGutter
}: SaSaPlacementInput): SaSaPlacement {
  const isDesktop = viewport.width > 640;

  for (const anchor of anchors) {
    if ((anchor.definition.availability === "desktop" && !isDesktop) || !isVisible(anchor.rect, viewport)) {
      continue;
    }

    const candidate = placeAtAnchor(anchor, actor, gutter);

    if (!fits(candidate, viewport, gutter) || safeZones.some((zone) => overlaps(candidate, zone))) {
      continue;
    }

    return {
      left: candidate.left,
      top: candidate.top,
      source: "anchor",
      anchorId: anchor.definition.id
    };
  }

  return viewportFallback(viewport, actor, gutter);
}
