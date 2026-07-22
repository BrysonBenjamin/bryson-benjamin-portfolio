import type { SaSaBehavior, SaSaBehaviorEvent, SaSaBehaviorSource, SaSaRuntimeState } from "./contracts";

export type SaSaBehaviorDefinition = {
  id: SaSaBehavior;
  priority: number;
  interruptible: boolean;
  loop: boolean;
};

export type SaSaBehaviorRegistry = Record<SaSaBehavior, SaSaBehaviorDefinition>;

export const saSaBehaviorRegistry: SaSaBehaviorRegistry = {
  idle: { id: "idle", priority: 0, interruptible: true, loop: true },
  reacting: { id: "reacting", priority: 1, interruptible: true, loop: false },
  thinking: { id: "thinking", priority: 2, interruptible: true, loop: true },
  speaking: { id: "speaking", priority: 2, interruptible: true, loop: true },
  acting: { id: "acting", priority: 3, interruptible: true, loop: true },
  walking: { id: "walking", priority: 1, interruptible: true, loop: true },
  arriving: { id: "arriving", priority: 1, interruptible: true, loop: false },
  success: { id: "success", priority: 1, interruptible: true, loop: false },
  error: { id: "error", priority: 3, interruptible: true, loop: false },
  offline: { id: "offline", priority: 3, interruptible: true, loop: true },
  loafing: { id: "loafing", priority: 0, interruptible: true, loop: true }
};

export const initialSaSaRuntimeState: SaSaRuntimeState = {
  activeBehavior: "idle",
  source: "system",
  revision: 0
};

export function validateSaSaBehaviorRegistry(registry: SaSaBehaviorRegistry = saSaBehaviorRegistry) {
  for (const [id, definition] of Object.entries(registry)) {
    if (definition.id !== id) {
      throw new Error(`Sa-Sa behavior registry key \"${id}\" must match definition id \"${definition.id}\".`);
    }

    if (definition.priority < 0) {
      throw new Error(`Sa-Sa behavior \"${id}\" cannot have a negative priority.`);
    }
  }
}

export function reduceSaSaRuntime(
  state: SaSaRuntimeState,
  event: SaSaBehaviorEvent,
  registry: SaSaBehaviorRegistry = saSaBehaviorRegistry
): SaSaRuntimeState {
  if (event.type === "SYSTEM_RESET") {
    return { ...initialSaSaRuntimeState, revision: state.revision + 1 };
  }

  if (event.type === "BEHAVIOR_FINISHED") {
    if (event.behavior !== state.activeBehavior || registry[event.behavior].loop) {
      return state;
    }

    return {
      activeBehavior: "idle",
      source: "system",
      revision: state.revision + 1
    };
  }

  const current = registry[state.activeBehavior];
  const requested = registry[event.behavior];

  if (
    event.behavior === state.activeBehavior ||
    (!current.interruptible && requested.priority <= current.priority) ||
    requested.priority < current.priority
  ) {
    return state;
  }

  return {
    activeBehavior: event.behavior,
    source: event.source,
    revision: state.revision + 1
  };
}

export type SaSaRuntime = {
  dispatch: (event: SaSaBehaviorEvent) => SaSaRuntimeState;
  getState: () => SaSaRuntimeState;
  subscribe: (listener: (state: SaSaRuntimeState) => void) => () => void;
};

export function createSaSaRuntime(
  registry: SaSaBehaviorRegistry = saSaBehaviorRegistry,
  initialState: SaSaRuntimeState = initialSaSaRuntimeState
): SaSaRuntime {
  validateSaSaBehaviorRegistry(registry);

  let state = initialState;
  const listeners = new Set<(nextState: SaSaRuntimeState) => void>();

  return {
    dispatch(event) {
      const nextState = reduceSaSaRuntime(state, event, registry);

      if (nextState !== state) {
        state = nextState;
        listeners.forEach((listener) => listener(state));
      }

      return state;
    },
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

export function requestSaSaBehavior(behavior: SaSaBehavior, source: SaSaBehaviorSource): SaSaBehaviorEvent {
  return { type: "BEHAVIOR_REQUESTED", behavior, source };
}
