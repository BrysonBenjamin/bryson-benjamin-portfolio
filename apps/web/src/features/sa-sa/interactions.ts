export type SaSaDirectInteractionGate = {
  canReact: (now: number) => boolean;
  reset: () => void;
};

/** Small pure cooldown gate shared by pointer, touch, and keyboard local reactions. */
export function createSaSaDirectInteractionGate(cooldownMs = 1400): SaSaDirectInteractionGate {
  let lastReactionAt = Number.NEGATIVE_INFINITY;

  return {
    canReact(now) {
      if (now - lastReactionAt < cooldownMs) return false;
      lastReactionAt = now;
      return true;
    },
    reset() {
      lastReactionAt = Number.NEGATIVE_INFINITY;
    }
  };
}
