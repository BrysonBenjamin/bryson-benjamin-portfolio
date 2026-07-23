import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent, type PointerEvent } from "react";
import { MessageCircle, Pause, Play, Sparkles, WandSparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SaSa } from "../../components/brand/SaSa";
import { createSaSaAmbientScheduler, type SaSaAmbientVisual } from "./ambient";
import { useSaSaConversation } from "./conversation";
import { createSaSaDirectInteractionGate } from "./interactions";
import { resolveSaSaPlacement, type SaSaPlacement } from "./placement";
import { useSaSaRuntime } from "./SaSaProvider";
import { createSaSaAgentContext } from "./scenes";
import { useSaSaScenes } from "./SaSaSceneProvider";

type SaSaActorProps = {
  hidden?: boolean;
};

const restingVisual: SaSaAmbientVisual = { blink: false, eyes: "center", behavior: "idle" };
const actorBounds = { width: 128, height: 136 };
const pausedStorageKey = "sa-sa-motion-paused-v1";
const dismissedStorageKey = "sa-sa-dismissed-v1";

const starterPrompts = ["What are you building?", "Open the second one", "Tell me about Bryson"];

function conversationStatusLabel(status: ReturnType<typeof useSaSaConversation>["state"]["status"]) {
  const labels = {
    idle: "Ready",
    thinking: "Thinking",
    acting: "Checking portfolio facts",
    speaking: "Replying",
    success: "Done",
    error: "Something went wrong",
    offline: "Guide unavailable"
  };

  return labels[status];
}

export function SaSaActor({ hidden = false }: SaSaActorProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [paused, setPaused] = useState(() => window.localStorage.getItem(pausedStorageKey) === "true");
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem(dismissedStorageKey) === "true");
  const [ambient, setAmbient] = useState<SaSaAmbientVisual>(restingVisual);
  const [placement, setPlacement] = useState<SaSaPlacement | null>(null);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === "visible");
  const [menuOpen, setMenuOpen] = useState(false);
  const schedulerRef = useRef(createSaSaAmbientScheduler("sa-sa-site-v1"));
  const interactionGateRef = useRef(createSaSaDirectInteractionGate());
  const interactionTimeoutRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { dispatch, requestBehavior, state } = useSaSaRuntime();
  const { getAnchorElement, getSafeZoneElement, runAction, snapshot } = useSaSaScenes();
  const agentContext = useMemo(
    () =>
      createSaSaAgentContext(snapshot, {
        locale: navigator.language || "en-US",
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      }),
    [snapshot]
  );
  const requestAgentBehavior = useCallback(
    (behavior: "thinking" | "acting" | "speaking" | "success" | "error" | "offline") => {
      requestBehavior(behavior, "agent");
    },
    [requestBehavior]
  );
  const conversation = useSaSaConversation({
    context: agentContext,
    onBehavior: requestAgentBehavior,
    runAction
  });

  useEffect(() => {
    function updateVisibility() {
      setPageVisible(document.visibilityState === "visible");
    }

    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(pausedStorageKey, String(paused));
  }, [paused]);

  useEffect(() => {
    window.localStorage.setItem(dismissedStorageKey, String(dismissed));
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) {
      setPlacement(null);
      return;
    }

    const anchors = snapshot.anchors.flatMap((definition) => {
      const element = getAnchorElement(definition.id);
      return element ? [{ definition, element }] : [];
    });
    const safeZoneElements = snapshot.safeZoneIds.flatMap((id) => {
      const element = getSafeZoneElement(id);
      return element ? [element] : [];
    });
    let frameId: number | null = null;

    function updatePlacement() {
      frameId = null;
      const next = resolveSaSaPlacement({
        viewport: { width: window.innerWidth, height: window.innerHeight },
        actor: actorBounds,
        anchors: anchors.map(({ definition, element }) => ({
          definition,
          rect: element.getBoundingClientRect()
        })),
        safeZones: safeZoneElements.map((element) => element.getBoundingClientRect())
      });

      setPlacement((current) =>
        current &&
        current.left === next.left &&
        current.top === next.top &&
        current.source === next.source &&
        current.anchorId === next.anchorId
          ? current
          : next
      );
    }

    function scheduleUpdate() {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updatePlacement);
      }
    }

    const observer = new ResizeObserver(scheduleUpdate);
    anchors.forEach(({ element }) => observer.observe(element));
    safeZoneElements.forEach((element) => observer.observe(element));
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    scheduleUpdate();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [dismissed, getAnchorElement, getSafeZoneElement, snapshot.anchors, snapshot.safeZoneIds]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (dismissed || hidden || paused || expanded || !pageVisible || reduceMotion || state.activeBehavior !== "idle") {
      setAmbient(restingVisual);
      return;
    }

    let delayId: number | null = null;
    let durationId: number | null = null;
    let cancelled = false;

    function scheduleNextMoment() {
      const moment = schedulerRef.current.next();
      delayId = window.setTimeout(() => {
        if (cancelled) return;

        setAmbient({ blink: moment.blink, eyes: moment.eyes, behavior: moment.behavior });
        durationId = window.setTimeout(() => {
          if (cancelled) return;
          setAmbient(restingVisual);
          scheduleNextMoment();
        }, moment.durationMs);
      }, moment.delayMs);
    }

    scheduleNextMoment();

    return () => {
      cancelled = true;
      if (delayId !== null) window.clearTimeout(delayId);
      if (durationId !== null) window.clearTimeout(durationId);
    };
  }, [dismissed, expanded, hidden, pageVisible, paused, state.activeBehavior]);

  useEffect(
    () => () => {
      if (interactionTimeoutRef.current !== null) window.clearTimeout(interactionTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (!expanded) return;
    inputRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    if (!menuOpen) return;

    const frame = window.requestAnimationFrame(() => menuRef.current?.focus());

    function closeMenuOnOutsidePress(event: globalThis.PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeMenuOnOutsidePress);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", closeMenuOnOutsidePress);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (conversation.state.status === "success") {
      const timeout = window.setTimeout(() => {
        dispatch({ type: "BEHAVIOR_FINISHED", behavior: "success" });
        conversation.settle();
      }, 700);
      return () => window.clearTimeout(timeout);
    }

    if (conversation.state.status === "error" || conversation.state.status === "offline") {
      requestAgentBehavior(conversation.state.status);
    }
  }, [conversation, dispatch, requestAgentBehavior]);

  function open() {
    setMenuOpen(false);
    setExpanded(true);
    dispatch({ type: "SYSTEM_RESET" });
  }

  function close() {
    conversation.stop();
    setExpanded(false);
    setMenuOpen(false);
    dispatch({ type: "SYSTEM_RESET" });
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function togglePause() {
    setPaused((current) => !current);
    setMenuOpen(false);
    dispatch({ type: "SYSTEM_RESET" });
  }

  function dismiss() {
    conversation.stop();
    setExpanded(false);
    setDismissed(true);
    setMenuOpen(false);
    dispatch({ type: "SYSTEM_RESET" });
  }

  function restore() {
    setDismissed(false);
  }

  function reactToDirectInput() {
    if (expanded || hidden || paused || state.activeBehavior !== "idle" || !interactionGateRef.current.canReact(Date.now())) {
      return;
    }

    requestBehavior("reacting", "interaction");
    if (interactionTimeoutRef.current !== null) window.clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = window.setTimeout(() => {
      dispatch({ type: "BEHAVIOR_FINISHED", behavior: "reacting" });
      interactionTimeoutRef.current = null;
    }, 520);
  }

  function directEyeDirection(event: PointerEvent<HTMLButtonElement>) {
    if (expanded || event.pointerType === "touch" || state.activeBehavior !== "idle") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setAmbient((current) => ({
      ...current,
      eyes: event.clientX < bounds.left + bounds.width / 2 ? "left" : "right"
    }));
  }

  function clearDirectEyeDirection() {
    setAmbient((current) => ({ ...current, eyes: "center" }));
  }

  function openCharacterMenu(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setMenuOpen(true);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
      event.preventDefault();
      setMenuOpen(true);
    }
  }

  function openPlayground() {
    setMenuOpen(false);
    navigate("/sa-sa/playground");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    void conversation.send(draft);
    setDraft("");
  }

  function chooseStarter(prompt: string) {
    void conversation.send(prompt);
  }

  const actorState = state.activeBehavior === "idle" ? ambient.behavior : state.activeBehavior;
  const actorStyle: CSSProperties | undefined = placement
    ? { left: `${placement.left}px`, top: `${placement.top}px`, right: "auto", bottom: "auto" }
    : undefined;

  if (dismissed) {
    return hidden ? null : (
      <button aria-label="Show Sa-Sa" className="sa-sa-actor__restore" onClick={restore} type="button">
        Show Sa-Sa
      </button>
    );
  }

  return (
    <aside
      aria-label="Sa-Sa portfolio guide"
      className="sa-sa-actor"
      data-expanded={expanded || undefined}
      data-placement-source={placement?.source}
      data-scene={snapshot.activeSceneId ?? undefined}
      hidden={hidden}
      style={actorStyle}
    >
      {expanded ? (
        <section
          aria-describedby="sa-sa-retention"
          aria-label="Chat with Sa-Sa"
          className="sa-sa-actor__panel"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          role="dialog"
        >
          <div className="sa-sa-actor__panel-header">
            <div>
              <strong>Sa-Sa</strong>
              <span>{conversationStatusLabel(conversation.state.status)}</span>
            </div>
            <button className="sa-sa-actor__close" onClick={close} type="button">
              Close
            </button>
          </div>

          <p className="sa-sa-actor__retention" id="sa-sa-retention">
            Uses approved public portfolio facts. This tab can remember the conversation for up to 24 hours; Clear removes it now.
          </p>

          <div aria-live="polite" className="sa-sa-actor__live-status" role="status">
            {conversation.state.error ?? (conversation.state.isStreaming ? conversationStatusLabel(conversation.state.status) : "")}
          </div>

          {conversation.state.messages.length ? (
            <ol aria-label="Conversation" className="sa-sa-actor__messages">
              {conversation.state.messages.map((message) => (
                <li className={`sa-sa-actor__message sa-sa-actor__message--${message.role}`} key={message.id}>
                  <span>{message.text || "…"}</span>
                  {message.complete && message.sources.length ? (
                    <span className="sa-sa-actor__sources">
                      Sources:{" "}
                      {message.sources.map((source, index) => (
                        <a href={source.href} key={source.id}>
                          {index ? `, ${source.title}` : source.title}
                        </a>
                      ))}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <div className="sa-sa-actor__starters">
              <p>Ask about the public work, or let me point you somewhere on the page.</p>
              {starterPrompts.map((prompt) => (
                <button key={prompt} onClick={() => chooseStarter(prompt)} type="button">
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {conversation.state.actionResult ? (
            <p className="sa-sa-actor__action-result" role="status">
              {conversation.state.actionResult.message}
            </p>
          ) : null}

          <form className="sa-sa-actor__form" onSubmit={submit}>
            <label className="sa-sa-actor__input-label" htmlFor="sa-sa-message">
              Ask Sa-Sa about this portfolio
            </label>
            <input
              autoComplete="off"
              disabled={conversation.state.isStreaming}
              id="sa-sa-message"
              maxLength={1200}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about the work…"
              ref={inputRef}
              value={draft}
            />
            <div className="sa-sa-actor__form-actions">
              {conversation.state.isStreaming ? (
                <button onClick={conversation.stop} type="button">
                  Stop
                </button>
              ) : (
                <button disabled={!draft.trim()} type="submit">
                  Send
                </button>
              )}
              {conversation.state.error && conversation.state.lastUserMessage ? (
                <button onClick={() => void conversation.send(conversation.state.lastUserMessage!)} type="button">
                  Retry
                </button>
              ) : null}
              <button onClick={() => void conversation.clear()} type="button">
                Clear
              </button>
              <button onClick={togglePause} type="button">
                {paused ? "Resume motion" : "Pause motion"}
              </button>
              <button onClick={dismiss} type="button">
                Hide Sa-Sa
              </button>
            </div>
          </form>
        </section>
      ) : null}
      {menuOpen ? (
        <div aria-label="Sa-Sa actions" className="sa-sa-actor__menu" onKeyDown={(event) => {
          if (event.key === "Escape") {
            setMenuOpen(false);
            triggerRef.current?.focus();
          }
        }} ref={menuRef} role="menu" tabIndex={-1}>
          <button onClick={open} role="menuitem" type="button"><MessageCircle size={16} aria-hidden="true" />Chat with Sa-Sa</button>
          <button onClick={() => { reactToDirectInput(); setMenuOpen(false); }} role="menuitem" type="button"><Sparkles size={16} aria-hidden="true" />React</button>
          <button onClick={togglePause} role="menuitem" type="button">{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}{paused ? "Resume motion" : "Pause motion"}</button>
          <button onClick={openPlayground} role="menuitem" type="button"><WandSparkles size={16} aria-hidden="true" />Open playground</button>
          <button onClick={dismiss} role="menuitem" type="button">Hide Sa-Sa</button>
        </div>
      ) : null}
      <button
        aria-expanded={expanded}
        aria-label={expanded ? "Sa-Sa is open" : "Open Sa-Sa"}
        className="sa-sa-actor__trigger"
        onFocus={reactToDirectInput}
        onClick={expanded ? close : open}
        onContextMenu={openCharacterMenu}
        onKeyDown={handleTriggerKeyDown}
        onPointerEnter={reactToDirectInput}
        onPointerLeave={clearDirectEyeDirection}
        onPointerMove={directEyeDirection}
        ref={triggerRef}
        type="button"
      >
        <SaSa
          animate={!hidden && !paused}
          blink={ambient.blink && actorState === "idle"}
          decorative
          eyes={ambient.eyes}
          size={104}
          state={actorState}
        />
        <span className="sa-sa-actor__label">Sa-Sa</span>
      </button>
    </aside>
  );
}
