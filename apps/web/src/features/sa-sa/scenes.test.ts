import { describe, expect, it } from "vitest";
import { createSaSaAgentContext, createSaSaContextSnapshot } from "./scenes";

describe("Sa-Sa scenes", () => {
  it("selects the highest-priority scene and creates an allowlisted agent context", () => {
    const snapshot = createSaSaContextSnapshot([
      {
        id: "base",
        priority: 1,
        anchors: [{ id: "base-dock", placement: "inline-end", availability: "all" }],
        safeZones: [],
        content: [{ type: "section", id: "work" }],
        actions: [{ id: "scroll-to-work", label: "Show work" }]
      },
      {
        id: "overlay",
        priority: 10,
        anchors: [],
        safeZones: [{ id: "dialog" }],
        content: [{ type: "feed-item", id: "BRY-39" }],
        actions: [{ id: "close-dialog", label: "Close" }]
      }
    ]);

    expect(snapshot.activeSceneId).toBe("overlay");
    expect(
      createSaSaAgentContext(snapshot, { locale: "en-US", reducedMotion: false })
    ).toMatchObject({
      sceneId: "overlay",
      activeAnchorIds: [],
      availableActionIds: ["close-dialog"]
    });
  });
});
