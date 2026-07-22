import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import {
  createSaSaRuntime,
  initialSaSaRuntimeState,
  requestSaSaBehavior,
  type SaSaRuntime
} from "./runtime";
import type { SaSaBehavior, SaSaBehaviorEvent, SaSaBehaviorSource, SaSaRuntimeState } from "./contracts";

type SaSaRuntimeContextValue = {
  dispatch: (event: SaSaBehaviorEvent) => SaSaRuntimeState;
  requestBehavior: (behavior: SaSaBehavior, source: SaSaBehaviorSource) => SaSaRuntimeState;
  state: SaSaRuntimeState;
};

const SaSaRuntimeContext = createContext<SaSaRuntimeContextValue | null>(null);

export function SaSaProvider({ children }: PropsWithChildren) {
  const runtimeRef = useRef<SaSaRuntime | null>(null);

  if (!runtimeRef.current) {
    runtimeRef.current = createSaSaRuntime();
  }

  const runtime = runtimeRef.current;
  const [state, setState] = useState(initialSaSaRuntimeState);

  useEffect(() => runtime.subscribe(setState), [runtime]);

  const dispatch = useCallback((event: SaSaBehaviorEvent) => runtime.dispatch(event), [runtime]);
  const requestBehavior = useCallback(
    (behavior: SaSaBehavior, source: SaSaBehaviorSource) => runtime.dispatch(requestSaSaBehavior(behavior, source)),
    [runtime]
  );

  return (
    <SaSaRuntimeContext.Provider value={{ dispatch, requestBehavior, state }}>
      {children}
    </SaSaRuntimeContext.Provider>
  );
}

export function useSaSaRuntime() {
  const context = useContext(SaSaRuntimeContext);

  if (!context) {
    throw new Error("useSaSaRuntime must be used inside SaSaProvider.");
  }

  return context;
}
