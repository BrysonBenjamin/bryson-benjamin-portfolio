import {
  saSaAgentLimits,
  saSaContractVersion,
  type SaSaAgentEvent,
  type SaSaAgentEventPayload,
  type SaSaPageActionProposal,
  type SaSaSourceReference,
  type SaSaToolCall,
  type SaSaTurnRequest,
  validateSaSaPageActionProposal,
  validateSaSaToolCall
} from "@bryson-benjamin/sa-sa-contracts";
import { runPortfolioKnowledgeTool } from "./knowledge";

type SaSaAgentMode = "disabled" | "deterministic";

type SaSaSession = {
  id: string;
  expiresAt: number;
  activeTurnId: string | null;
  completedTurns: Map<string, readonly SaSaAgentEvent[]>;
  recentTurnStarts: number[];
};

export type SaSaAgentGateway = {
  createSession: () => { id: string; expiresAt: string; mode: SaSaAgentMode };
  clearSession: (sessionId: string) => boolean;
  streamTurn: (request: SaSaTurnRequest, signal?: AbortSignal) => AsyncGenerator<SaSaAgentEvent>;
};

export type SaSaAgentGatewayOptions = {
  mode?: SaSaAgentMode;
  now?: () => number;
  createId?: () => string;
};

const sessionLifetimeMs = 24 * 60 * 60 * 1000;
const rateWindowMs = 60 * 1000;
const maxTurnsPerMinute = 8;

function hasPrivateDataRequest(message: string) {
  return /\b(password|secret|private linear|home address|social security|ssn|phone number)\b/i.test(message);
}

function hasInjectionRequest(message: string) {
  return /\b(ignore (all |previous )?instructions|reveal (the )?(prompt|system)|developer message)\b/i.test(message);
}

function textChunks(text: string) {
  return text.match(/.{1,92}(?:\s|$)/g) ?? [text];
}

function determineTools(message: string): readonly SaSaToolCall[] {
  if (/\b(what|which).{0,50}\b(build|building|work|project)/i.test(message)) {
    return [
      { id: "get-profile", input: {} },
      { id: "list-projects", input: {} }
    ];
  }

  const projectMatch = message.match(/\b(portfolio|linear feed|design system)\b/i)?.[1]?.toLowerCase();
  const projectId =
    projectMatch === "portfolio"
      ? "portfolio"
      : projectMatch === "linear feed"
        ? "linear-feed-bridge"
        : projectMatch === "design system"
          ? "design-system"
          : null;

  return projectId ? [{ id: "get-project", input: { id: projectId } }] : [{ id: "get-profile", input: {} }];
}

function determineAction(message: string, request: SaSaTurnRequest): SaSaPageActionProposal | null {
  if (/\b(open|show).{0,30}\b(second|2nd|work|project)/i.test(message)) {
    const actionId = request.context.availableActionIds.find((id) => id === "scroll-to-section");
    return actionId ? { actionId, label: "Show selected work", input: { sectionId: "work" } } : null;
  }

  if (/\b(about|who is bryson)\b/i.test(message)) {
    const actionId = request.context.availableActionIds.find((id) => id === "scroll-to-section");
    return actionId ? { actionId, label: "Show about Bryson", input: { sectionId: "about" } } : null;
  }

  return null;
}

function answerFor(message: string, toolText: readonly string[], action: SaSaPageActionProposal | null) {
  if (action) {
    return action.input.sectionId === "work"
      ? "I found the second project: Linear feed bridge. I can take you to the selected work section."
      : "I can take you to the public About section."
  }

  if (/\b(what|which).{0,50}\b(build|building|work|project)/i.test(message)) {
    return "Bryson is building a public portfolio that connects product planning, documentation, and a public build log. The current work also includes a label-gated Linear feed bridge and a small personal design system.";
  }

  return toolText[0] ?? "I only know the public portfolio facts that are available on this site.";
}

export function createSaSaAgentGateway({
  mode = "disabled",
  now = () => Date.now(),
  createId = () => crypto.randomUUID()
}: SaSaAgentGatewayOptions = {}): SaSaAgentGateway {
  const sessions = new Map<string, SaSaSession>();

  function purgeExpiredSessions() {
    const current = now();
    for (const [id, session] of sessions) {
      if (session.expiresAt <= current) sessions.delete(id);
    }
  }

  function createSession() {
    purgeExpiredSessions();
    const id = createId();
    const expiresAt = now() + sessionLifetimeMs;
    sessions.set(id, { id, expiresAt, activeTurnId: null, completedTurns: new Map(), recentTurnStarts: [] });
    return { id, expiresAt: new Date(expiresAt).toISOString(), mode };
  }

  function getSession(id: string | undefined) {
    purgeExpiredSessions();
    return id ? sessions.get(id) ?? null : null;
  }

  async function* streamTurn(request: SaSaTurnRequest, signal?: AbortSignal): AsyncGenerator<SaSaAgentEvent> {
    const session = getSession(request.sessionId);
    const createdAt = () => new Date(now()).toISOString();
    const turnId = createId();
    let sequence = 0;
    const event = (payload: SaSaAgentEventPayload): SaSaAgentEvent => ({
      version: saSaContractVersion,
      sessionId: session?.id ?? "invalid",
      turnId,
      sequence: ++sequence,
      createdAt: createdAt(),
      payload
    });

    if (!session) {
      yield event({ type: "failed", code: "invalid-request", message: "Start a new Sa-Sa session before sending a message.", retryable: true });
      return;
    }

    const replay = session.completedTurns.get(request.clientTurnId);
    if (replay) {
      yield* replay;
      return;
    }

    if (mode === "disabled") {
      yield event({
        type: "failed",
        code: "agent-disabled",
        message: "Sa-Sa's live guide is not enabled right now. You can still use the portfolio navigation.",
        retryable: false
      });
      return;
    }

    if (session.activeTurnId) {
      yield event({ type: "failed", code: "session-busy", message: "Sa-Sa is finishing the previous answer.", retryable: true });
      return;
    }

    const current = now();
    session.recentTurnStarts = session.recentTurnStarts.filter((timestamp) => timestamp > current - rateWindowMs);
    if (session.recentTurnStarts.length >= maxTurnsPerMinute) {
      yield event({ type: "failed", code: "rate-limited", message: "Sa-Sa needs a short breather before the next question.", retryable: true });
      return;
    }

    if (hasPrivateDataRequest(request.message) || hasInjectionRequest(request.message)) {
      yield event({
        type: "failed",
        code: "policy-denied",
        message: "I can only help with the approved public portfolio information and registered page actions.",
        retryable: false
      });
      return;
    }

    session.activeTurnId = turnId;
    session.recentTurnStarts.push(current);
    const emitted: SaSaAgentEvent[] = [];
    const emit = (payload: SaSaAgentEventPayload) => {
      const next = event(payload);
      emitted.push(next);
      return next;
    };

    try {
      if (signal?.aborted) {
        yield emit({ type: "failed", code: "cancelled", message: "Sa-Sa stopped that answer.", retryable: true });
        return;
      }

      yield emit({ type: "accepted", message: "Sa-Sa is checking the public portfolio." });
      yield emit({ type: "behavior-requested", behavior: "thinking" });

      const toolText: string[] = [];
      const sources: SaSaSourceReference[] = [];
      const calls = determineTools(request.message).slice(0, saSaAgentLimits.maxToolCallsPerTurn);

      for (const call of calls) {
        const validated = validateSaSaToolCall(call);
        if (!validated.success) continue;
        if (signal?.aborted) {
          yield emit({ type: "failed", code: "cancelled", message: "Sa-Sa stopped that answer.", retryable: true });
          return;
        }

        yield emit({ type: "behavior-requested", behavior: "acting" });
        yield emit({ type: "tool-started", tool: validated.data.id, label: "Checking public portfolio facts" });
        const result = runPortfolioKnowledgeTool(validated.data);

        if (result) {
          toolText.push(result.text);
          sources.push(...result.sources);
          yield emit({ type: "tool-completed", tool: validated.data.id, sources: result.sources });
        }
      }

      const action = determineAction(request.message, request);
      const validatedAction = validateSaSaPageActionProposal(action);
      if (validatedAction.success) {
        yield emit({ type: "action-proposed", action: validatedAction.data });
      }

      yield emit({ type: "behavior-requested", behavior: "speaking" });
      for (const delta of textChunks(answerFor(request.message, toolText, validatedAction.success ? validatedAction.data : null))) {
        if (signal?.aborted) {
          yield emit({ type: "failed", code: "cancelled", message: "Sa-Sa stopped that answer.", retryable: true });
          return;
        }
        yield emit({ type: "text-delta", delta });
      }

      yield emit({ type: "behavior-requested", behavior: "success" });
      yield emit({ type: "completed", sources });
      session.completedTurns.set(request.clientTurnId, emitted);
    } catch {
      yield emit({ type: "failed", code: "unavailable", message: "Sa-Sa could not reach the public guide just now.", retryable: true });
    } finally {
      session.activeTurnId = null;
    }
  }

  return {
    createSession,
    clearSession(sessionId) {
      return sessions.delete(sessionId);
    },
    streamTurn
  };
}
