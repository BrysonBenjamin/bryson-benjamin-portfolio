import { describe, expect, it } from "vitest";
import { resolveSaSaPlacement } from "./placement";

const viewport = { width: 1280, height: 800 };
const actor = { width: 128, height: 136 };

describe("Sa-Sa placement", () => {
  it("uses a visible, declared nesting area when it fits", () => {
    const placement = resolveSaSaPlacement({
      viewport,
      actor,
      anchors: [
        {
          definition: { id: "hero", placement: "inline-end", availability: "all" },
          rect: { left: 780, top: 250, width: 180, height: 200 }
        }
      ]
    });

    expect(placement).toEqual({ left: 984, top: 314, source: "anchor", anchorId: "hero" });
  });

  it("falls back to the viewport when a safe zone would be covered", () => {
    const placement = resolveSaSaPlacement({
      viewport,
      actor,
      anchors: [
        {
          definition: { id: "hero", placement: "inline-end", availability: "all" },
          rect: { left: 780, top: 250, width: 180, height: 200 }
        }
      ],
      safeZones: [{ left: 950, top: 280, width: 250, height: 220 }]
    });

    expect(placement).toEqual({ left: 1128, top: 640, source: "viewport" });
  });

  it("does not use desktop-only nests on small screens", () => {
    const placement = resolveSaSaPlacement({
      viewport: { width: 390, height: 844 },
      actor,
      anchors: [
        {
          definition: { id: "work", placement: "block-end", availability: "desktop" },
          rect: { left: 120, top: 200, width: 160, height: 40 }
        }
      ]
    });

    expect(placement).toEqual({ left: 238, top: 684, source: "viewport" });
  });
});
