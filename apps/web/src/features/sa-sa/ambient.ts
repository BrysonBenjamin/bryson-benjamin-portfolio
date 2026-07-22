export type SaSaAmbientVisual = {
  blink: boolean;
  eyes: "center" | "left" | "right";
  behavior: "idle" | "loafing";
};

export type SaSaAmbientMoment = SaSaAmbientVisual & {
  delayMs: number;
  durationMs: number;
};

export type SaSaAmbientScheduler = {
  next: () => SaSaAmbientMoment;
};

type RandomSource = () => number;

const ambientMoments: readonly Omit<SaSaAmbientVisual, "behavior">[] = [
  { blink: true, eyes: "center" },
  { blink: false, eyes: "left" },
  { blink: false, eyes: "right" },
  { blink: false, eyes: "center" }
];

export function createSeededRandom(seed: string): RandomSource {
  let value = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

/** A pure, seeded scheduler so motion is predictable, throttled, and testable. */
export function createSaSaAmbientScheduler(seed = "sa-sa-v1", random: RandomSource = createSeededRandom(seed)): SaSaAmbientScheduler {
  let previousIndex = -1;

  return {
    next() {
      let index = Math.floor(random() * ambientMoments.length);

      if (index === previousIndex) {
        index = (index + 1) % ambientMoments.length;
      }

      previousIndex = index;
      const visual = ambientMoments[index];
      const loafing = index === ambientMoments.length - 1 && random() > 0.72;

      return {
        ...visual,
        behavior: loafing ? "loafing" : "idle",
        delayMs: 3600 + Math.round(random() * 3400),
        durationMs: loafing ? 2600 : visual.blink ? 180 : 900
      };
    }
  };
}
