import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PropsWithChildren
} from "react";
import {
  createSaSaContextSnapshot,
  validateSaSaScene,
  type SaSaContextSnapshot,
  type SaSaSceneDefinition
} from "./scenes";
import type { SaSaPageActionInput, SaSaPageActionResult } from "@bryson-benjamin/sa-sa-contracts";

type SaSaPageActionHandler = (input: SaSaPageActionInput) => void | Promise<void>;

type SaSaSceneContextValue = {
  registerScene: (scene: SaSaSceneDefinition) => () => void;
  registerAnchor: (id: string, element: HTMLElement) => () => void;
  registerSafeZone: (id: string, element: HTMLElement) => () => void;
  getAnchorElement: (id: string) => HTMLElement | null;
  getSafeZoneElement: (id: string) => HTMLElement | null;
  registerAction: (id: string, handler: SaSaPageActionHandler) => () => void;
  runAction: (id: string, input: SaSaPageActionInput) => Promise<SaSaPageActionResult>;
  snapshot: SaSaContextSnapshot;
};

const SaSaSceneContext = createContext<SaSaSceneContextValue | null>(null);

export function SaSaSceneProvider({ children }: PropsWithChildren) {
  const scenesRef = useRef(new Map<string, SaSaSceneDefinition>());
  const anchorsRef = useRef(new Map<string, HTMLElement>());
  const safeZonesRef = useRef(new Map<string, HTMLElement>());
  const actionsRef = useRef(new Map<string, SaSaPageActionHandler>());
  const [revision, setRevision] = useState(0);

  const registerElement = useCallback(
    (elements: MutableRefObject<Map<string, HTMLElement>>, id: string, element: HTMLElement) => {
      elements.current.set(id, element);
      setRevision((current) => current + 1);

      return () => {
        if (elements.current.get(id) === element) {
          elements.current.delete(id);
          setRevision((current) => current + 1);
        }
      };
    },
    []
  );

  const registerScene = useCallback((scene: SaSaSceneDefinition) => {
    validateSaSaScene(scene);
    scenesRef.current.set(scene.id, scene);
    setRevision((current) => current + 1);

    return () => {
      if (scenesRef.current.delete(scene.id)) {
        setRevision((current) => current + 1);
      }
    };
  }, []);

  const registerAnchor = useCallback(
    (id: string, element: HTMLElement) => registerElement(anchorsRef, id, element),
    [registerElement]
  );
  const registerSafeZone = useCallback(
    (id: string, element: HTMLElement) => registerElement(safeZonesRef, id, element),
    [registerElement]
  );
  const getAnchorElement = useCallback((id: string) => anchorsRef.current.get(id) ?? null, []);
  const getSafeZoneElement = useCallback((id: string) => safeZonesRef.current.get(id) ?? null, []);

  const snapshot = useMemo(
    () => createSaSaContextSnapshot([...scenesRef.current.values()]),
    [revision]
  );

  const registerAction = useCallback((id: string, handler: SaSaPageActionHandler) => {
    actionsRef.current.set(id, handler);

    return () => {
      if (actionsRef.current.get(id) === handler) actionsRef.current.delete(id);
    };
  }, []);

  const runAction = useCallback(
    async (id: string, input: SaSaPageActionInput): Promise<SaSaPageActionResult> => {
      if (!snapshot.availableActionIds.includes(id)) {
        return { actionId: id, outcome: "unavailable", message: "That action is not available on this part of the site." };
      }

      const handler = actionsRef.current.get(id);
      if (!handler) {
        return { actionId: id, outcome: "unavailable", message: "That page action is not ready right now." };
      }

      try {
        await handler(input);
        return { actionId: id, outcome: "completed", message: "Done." };
      } catch {
        return { actionId: id, outcome: "failed", message: "That page action could not be completed." };
      }
    },
    [snapshot.availableActionIds]
  );

  return (
    <SaSaSceneContext.Provider
      value={{
        registerScene,
        registerAnchor,
        registerSafeZone,
        getAnchorElement,
        getSafeZoneElement,
        registerAction,
        runAction,
        snapshot
      }}
    >
      {children}
    </SaSaSceneContext.Provider>
  );
}

export function SaSaScene({ scene }: { scene: SaSaSceneDefinition }) {
  const { registerScene } = useSaSaScenes();

  useEffect(() => registerScene(scene), [registerScene, scene]);
  return null;
}

/**
 * Registers a scene only while its page-owned section is materially visible.
 * The returned ref can be attached alongside an anchor ref without touching Sa-Sa core.
 */
export function useSaSaSectionScene(scene: SaSaSceneDefinition) {
  const { registerScene } = useSaSaScenes();
  const [active, setActive] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!active) return;
    return registerScene(scene);
  }, [active, registerScene, scene]);

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
    },
    []
  );

  return useCallback((element: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!element) {
      setActive(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry?.isIntersecting && entry.intersectionRatio >= 0.25),
      { threshold: [0, 0.25] }
    );
    observer.observe(element);
    observerRef.current = observer;
  }, []);
}

export function useSaSaScenes() {
  const context = useContext(SaSaSceneContext);

  if (!context) {
    throw new Error("useSaSaScenes must be used inside SaSaSceneProvider.");
  }

  return context;
}

function useRegisteredElement(
  register: (id: string, element: HTMLElement) => () => void,
  id: string
) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    },
    []
  );

  return useCallback(
    (element: HTMLElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = element ? register(id, element) : null;
    },
    [id, register]
  );
}

/** Attach this ref to a page-owned DOM element that Sa-Sa may use as a nesting area. */
export function useSaSaAnchor(id: string) {
  const { registerAnchor } = useSaSaScenes();
  return useRegisteredElement(registerAnchor, id);
}

/** Attach this ref to public controls or reading areas that Sa-Sa must not cover. */
export function useSaSaSafeZone(id: string) {
  const { registerSafeZone } = useSaSaScenes();
  return useRegisteredElement(registerSafeZone, id);
}

/** Registers a page-owned, allowlisted action without exposing DOM instructions to the agent. */
export function useSaSaPageAction(id: string, handler: SaSaPageActionHandler) {
  const { registerAction } = useSaSaScenes();

  useEffect(() => registerAction(id, handler), [handler, id, registerAction]);
}
