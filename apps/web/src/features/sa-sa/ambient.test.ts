import { describe, expect, it } from "vitest";
import { createSaSaAmbientScheduler, createSeededRandom } from "./ambient";

describe("Sa-Sa ambient scheduler", () => {
  it("produces the same motion plan for the same seed", () => {
    const first = createSaSaAmbientScheduler("fixture-seed");
    const second = createSaSaAmbientScheduler("fixture-seed");

    expect([first.next(), first.next(), first.next()]).toEqual([second.next(), second.next(), second.next()]);
  });

  it("avoids consecutive duplicate ambient moments and keeps pauses bounded", () => {
    const scheduler = createSaSaAmbientScheduler("ignored", createSeededRandom("stable"));
    const moments = Array.from({ length: 12 }, () => scheduler.next());

    for (const [index, moment] of moments.entries()) {
      expect(moment.delayMs).toBeGreaterThanOrEqual(3600);
      expect(moment.delayMs).toBeLessThanOrEqual(7000);
      expect(moment.durationMs).toBeGreaterThan(0);

      if (index > 0) {
        const previous = moments[index - 1];
        expect(`${moment.blink}:${moment.eyes}`).not.toBe(`${previous.blink}:${previous.eyes}`);
      }
    }
  });
});
