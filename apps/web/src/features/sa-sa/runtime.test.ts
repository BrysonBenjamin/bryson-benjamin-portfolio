import { describe, expect, it } from "vitest";
import {
  initialSaSaRuntimeState,
  reduceSaSaRuntime,
  requestSaSaBehavior,
  saSaBehaviorRegistry,
  validateSaSaBehaviorRegistry
} from "./runtime";

describe("Sa-Sa behavior runtime", () => {
  it("honors semantic priority and rejects a lower-priority interruption", () => {
    const acting = reduceSaSaRuntime(initialSaSaRuntimeState, requestSaSaBehavior("acting", "agent"));
    const ambient = reduceSaSaRuntime(acting, requestSaSaBehavior("loafing", "ambient"));

    expect(acting.activeBehavior).toBe("acting");
    expect(ambient).toBe(acting);
  });

  it("returns a completed one-shot behavior to stable idle", () => {
    const success = reduceSaSaRuntime(initialSaSaRuntimeState, requestSaSaBehavior("success", "agent"));
    const settled = reduceSaSaRuntime(success, { type: "BEHAVIOR_FINISHED", behavior: "success" });

    expect(settled).toMatchObject({ activeBehavior: "idle", source: "system" });
  });

  it("supports mock locomotion without making the renderer choose a state", () => {
    const walking = reduceSaSaRuntime(initialSaSaRuntimeState, requestSaSaBehavior("walking", "system"));
    const arriving = reduceSaSaRuntime(walking, requestSaSaBehavior("arriving", "system"));
    const settled = reduceSaSaRuntime(arriving, { type: "BEHAVIOR_FINISHED", behavior: "arriving" });

    expect(walking.activeBehavior).toBe("walking");
    expect(arriving.activeBehavior).toBe("arriving");
    expect(settled.activeBehavior).toBe("idle");
  });

  it("always allows a system reset to recover from an interrupted state", () => {
    const error = reduceSaSaRuntime(initialSaSaRuntimeState, requestSaSaBehavior("error", "agent"));
    const reset = reduceSaSaRuntime(error, { type: "SYSTEM_RESET" });

    expect(reset).toMatchObject({ activeBehavior: "idle", source: "system" });
    expect(reset.revision).toBe(error.revision + 1);
  });

  it("fails fast when a registry entry does not match its semantic id", () => {
    expect(() =>
      validateSaSaBehaviorRegistry({
        ...saSaBehaviorRegistry,
        idle: { ...saSaBehaviorRegistry.idle, id: "thinking" }
      })
    ).toThrow('Sa-Sa behavior registry key "idle"');
  });
});
