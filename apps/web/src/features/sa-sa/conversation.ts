import {
  saSaContractVersion,
  type SaSaAgentEvent,
  type SaSaBehaviorCue,
  type SaSaPageActionResult,
  type SaSaPageContext,
  type SaSaSourceReference
} from "@bryson-benjamin/sa-sa-contracts";
import { useCallback, useEffect, useReducer, useRef } from "react";

const storageKey = "sa-sa-conversation-v1";

export type SaSaConversationStatus = "idle" | SaSaBehaviorCue;

export type SaSaChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  complete: boolean;
  sources: readonly SaSaSourceReference[];
};

export type SaSaConversationState = {
  session: { id: string; expiresAt: string; mode: "disabled" | "deterministic" } | null;
  messages: readonly SaSaChatMessage[];
  status: SaSaConversationStatus;
  isStreaming: boolean;
  error: string | null;
  lastUserMessage: string | null;
  actionResult: SaSaPageActionResult | null;
};

export type SaSaConversationAction =
  | { type: "started"; session: SaSaConversationState["session"]; turnId: string; message: string }
  | { type: "event"; event: SaSaAgentEvent }
  | { type: "action-result"; result: SaSaPageActionResult }
  | { type: "network-failed"; message: string }
  | { type: "cancelled" }
  | { type: "settle" }
  | { type: "cleared" };

export function createEmptySaSaConversationState(): SaSaConversationState {
  return {
    session: null,
    messages: [],
    status: "idle",
    isStreaming: false,
    error: null,
    lastUserMessage: null,
    actionResult: null
  };
}

function restoreState(): SaSaConversationState {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return createEmptySaSaConversationState();
    const value = JSON.parse(raw) as Partial<SaSaConversationState>;

    if (!value.session || !Array.isArray(value.messages)) return createEmptySaSaConversationState();

    return {
      ...createEmptySaSaConversationState(),
      session: value.session,
      messages: value.messages.filter(
        (message): message is SaSaChatMessage =>
          typeof message?.id === "string" &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.text === "string" &&
          message.complete === true &&
          Array.isArray(message.sources)
      ),
      lastUserMessage: typeof value.lastUserMessage === "string" ? value.lastUserMessage : null
    };
  } catch {
    return createEmptySaSaConversationState();
  }
}

function assistantMessageId(turnId: string) {
  return `assistant:${turnId}`;
}

function activeAssistantMessageId(messages: readonly SaSaChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "assistant" && !message.complete)?.id ?? null;
}

function statusFromCue(cue: SaSaBehaviorCue): SaSaConversationStatus {
  return cue;
}

export function reduceSaSaConversation(
  state: SaSaConversationState,
  action: SaSaConversationAction
): SaSaConversationState {
  if (action.type === "cleared") return createEmptySaSaConversationState();

  if (action.type === "started") {
    return {
      ...state,
      session: action.session,
      messages: [
        ...state.messages,
        { id: `user:${action.turnId}`, role: "user", text: action.message, complete: true, sources: [] },
        { id: assistantMessageId(action.turnId), role: "assistant", text: "", complete: false, sources: [] }
      ],
      status: "thinking",
      isStreaming: true,
      error: null,
      lastUserMessage: action.message,
      actionResult: null
    };
  }

  if (action.type === "network-failed") {
    return {
      ...state,
      messages: state.messages.filter((message) => message.complete),
      status: "offline",
      isStreaming: false,
      error: action.message
    };
  }

  if (action.type === "cancelled") {
    return {
      ...state,
      messages: state.messages.filter((message) => message.complete),
      status: "idle",
      isStreaming: false,
      error: null
    };
  }

  if (action.type === "settle") {
    return { ...state, status: "idle", error: null };
  }

  if (action.type === "action-result") {
    return { ...state, actionResult: action.result };
  }

  const { payload } = action.event;
  if (payload.type === "accepted") {
    return { ...state, status: "thinking", error: null };
  }

  if (payload.type === "behavior-requested") {
    return { ...state, status: statusFromCue(payload.behavior) };
  }

  if (payload.type === "text-delta") {
    const id = activeAssistantMessageId(state.messages);
    return {
      ...state,
      status: "speaking",
      messages: state.messages.map((message) => (message.id === id ? { ...message, text: message.text + payload.delta } : message))
    };
  }

  if (payload.type === "completed") {
    const id = activeAssistantMessageId(state.messages);
    return {
      ...state,
      status: "success",
      isStreaming: false,
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, complete: true, sources: payload.sources } : message
      )
    };
  }

  if (payload.type === "failed") {
    return {
      ...state,
      messages: state.messages.filter((message) => message.complete),
      status: payload.code === "agent-disabled" || payload.code === "unavailable" ? "offline" : "error",
      isStreaming: false,
      error: payload.message
    };
  }

  return state;
}

async function readSaSaEventStream(
  response: Response,
  onEvent: (event: SaSaAgentEvent) => Promise<void> | void
) {
  if (!response.body) throw new Error("The Sa-Sa stream did not start.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastSequence = 0;
  let serverTurnId: string | null = null;

  async function consumeBlock(block: string) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return;

    const event = JSON.parse(data) as SaSaAgentEvent;
    if (event.version !== saSaContractVersion || event.sequence <= lastSequence) return;
    if (serverTurnId && event.turnId !== serverTurnId) return;
    serverTurnId ??= event.turnId;
    lastSequence = event.sequence;
    await onEvent(event);
  }

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");

    let delimiter = buffer.indexOf("\n\n");
    while (delimiter >= 0) {
      const block = buffer.slice(0, delimiter);
      buffer = buffer.slice(delimiter + 2);
      await consumeBlock(block);
      delimiter = buffer.indexOf("\n\n");
    }

    if (done) break;
  }

  if (buffer.trim()) await consumeBlock(buffer);
}

type UseSaSaConversationOptions = {
  context: SaSaPageContext;
  onBehavior: (behavior: SaSaBehaviorCue) => void;
  runAction: (id: string, input: unknown) => Promise<SaSaPageActionResult>;
};

export function useSaSaConversation({ context, onBehavior, runAction }: UseSaSaConversationOptions) {
  const [state, dispatch] = useReducer(reduceSaSaConversation, undefined, restoreState);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (state.isStreaming) return;
    const persisted = {
      session: state.session,
      messages: state.messages.filter((message) => message.complete),
      lastUserMessage: state.lastUserMessage
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(persisted));
  }, [state.isStreaming, state.lastUserMessage, state.messages, state.session]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const send = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || state.isStreaming) return;

      let session = state.session;
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (!session) {
          const sessionResponse = await fetch("/api/sa-sa/session", { method: "POST", signal: controller.signal });
          if (!sessionResponse.ok) throw new Error("Sa-Sa's guide is unavailable right now.");
          session = (await sessionResponse.json()) as SaSaConversationState["session"];
        }

        if (!session) throw new Error("Sa-Sa could not start a session.");
        const turnId = crypto.randomUUID();
        dispatch({ type: "started", session, turnId, message });
        onBehavior("thinking");

        const response = await fetch("/api/sa-sa/turn", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({
            version: saSaContractVersion,
            sessionId: session.id,
            clientTurnId: turnId,
            message,
            context
          })
        });
        if (!response.ok) throw new Error("Sa-Sa's guide could not answer that right now.");

        await readSaSaEventStream(response, async (event) => {
          dispatch({ type: "event", event });
          if (event.payload.type === "behavior-requested") onBehavior(event.payload.behavior);
          if (event.payload.type === "action-proposed") {
            dispatch({
              type: "action-result",
              result: await runAction(event.payload.action.actionId, event.payload.action.input)
            });
          }
        });
      } catch (error) {
        if (controller.signal.aborted) {
          dispatch({ type: "cancelled" });
        } else {
          dispatch({
            type: "network-failed",
            message: error instanceof Error ? error.message : "Sa-Sa's guide is unavailable right now."
          });
          onBehavior("offline");
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [context, onBehavior, runAction, state.isStreaming, state.session]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "cancelled" });
  }, []);

  const clear = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = null;
    const sessionId = state.session?.id;
    window.sessionStorage.removeItem(storageKey);
    dispatch({ type: "cleared" });
    if (sessionId) {
      await fetch(`/api/sa-sa/session/${encodeURIComponent(sessionId)}`, { method: "DELETE" }).catch(() => undefined);
    }
  }, [state.session?.id]);

  const settle = useCallback(() => dispatch({ type: "settle" }), []);

  return { state, send, stop, clear, settle };
}
