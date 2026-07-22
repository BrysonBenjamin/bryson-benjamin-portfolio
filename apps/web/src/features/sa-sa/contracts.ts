export const saSaBehaviorIds = [
  "idle",
  "reacting",
  "thinking",
  "speaking",
  "acting",
  "walking",
  "arriving",
  "success",
  "error",
  "offline",
  "loafing"
] as const;

export type SaSaBehavior = (typeof saSaBehaviorIds)[number];

export type SaSaBehaviorSource = "ambient" | "interaction" | "agent" | "system";

export type SaSaBehaviorEvent =
  | {
      type: "BEHAVIOR_REQUESTED";
      behavior: SaSaBehavior;
      source: SaSaBehaviorSource;
    }
  | {
      type: "BEHAVIOR_FINISHED";
      behavior: SaSaBehavior;
    }
  | {
      type: "SYSTEM_RESET";
    };

export type SaSaRuntimeState = {
  activeBehavior: SaSaBehavior;
  source: SaSaBehaviorSource;
  revision: number;
};
