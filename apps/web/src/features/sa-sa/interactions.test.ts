import { describe, expect, it } from "vitest";
import { createSaSaDirectInteractionGate } from "./interactions";

describe("Sa-Sa direct interaction cooldown", () => {
  it("accepts an intentional reaction and suppresses repeated events until the cooldown expires", () => {
    const gate = createSaSaDirectInteractionGate(1000);

    expect(gate.canReact(100)).toBe(true);
    expect(gate.canReact(900)).toBe(false);
    expect(gate.canReact(1100)).toBe(true);
  });

  it("can reset after a route or lifecycle interruption", () => {
    const gate = createSaSaDirectInteractionGate();
    gate.canReact(100);
    gate.reset();

    expect(gate.canReact(101)).toBe(true);
  });
});
