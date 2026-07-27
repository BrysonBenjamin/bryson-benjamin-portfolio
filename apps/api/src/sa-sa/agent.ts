import {
  saSaAgentLimits,
  saSaContractVersion,
  validateSaSaBehaviorCue,
  validateSaSaPageActionProposal,
  validateSaSaToolCall,
  type SaSaAgentEvent,
  type SaSaAgentEventPayload,
  type SaSaSourceReference,
  type SaSaTurnRequest
} from "@bryson-benjamin/sa-sa-contracts";
import { runPortfolioKnowledgeTool } from "./knowledge";
import { createDeterministicSaSaModelAdapter, type SaSaModelAdapter } from "./model";

export type SaSaAgentMode = "disabled" | "deterministic" | "provider";

type SaSaSession = {
  id: string;
  expiresAt: number;
  activeTurnId: string | null;
  completedTurns: Map<string, readonly SaSaAgentEvent[]>;
  recentTurnStarts: number[];
  usage: { inputTokens: number; outputTokens: number };
};

export type SaSaAgentGateway = {
  createSession: () => { id: string; expiresAt: string; mode: SaSaAgentMode };
  clearSession: (sessionId: string) => boolean;
  streamTurn: (request: SaSaTurnRequest, signal?: AbortSignal) => AsyncGenerator<SaSaAgentEvent>;
};

export type SaSaAgentGatewayOptions = {
  mode?: SaSaAgentMode;
  adapter?: SaSaModelAdapter;
  now?: () => number;
  createId?: () => string;
  turnDeadlineMs?: number;
  dailySpendLimitCents?: number;
  reservedTurnCostCents?: number;
};

const sessionLifetimeMs = 24 * 60 * 60 * 1000;
const rateWindowMs = 60 * 1000;
const maxTurnsPerMinute = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasPrivateDataRequest(message: string) {
  return /\b(password|secret|private linear|home address|social security|ssn|phone number)\b/i.test(message);
}

function hasInjectionRequest(message: string) {
  return /\b(ignore (all |previous )?instructions|reveal (the )?(prompt|system)|developer message)\b/i.test(message);
}

function isTextDelta(output: Record<string, unknown>): output is Record<string, unknown> & { type: "text-delta"; delta: string } {
  return output.type === "text-delta" && typeof output.delta === "string" && output.delta.length > 0;
}

function isUsage(output: Record<string, unknown>): output is Record<string, unknown> & { type: "usage"; inputTokens: number; outputTokens: number } {
  return output.type === "usage" && Number.isInteger(output.inputTokens) && (output.inputTokens as number) >= 0 && Number.isInteger(output.outputTokens) && (output.outputTokens as number) >= 0;
}

export function createSaSaAgentGateway({
  mode = "disabled",
  adapter = createDeterministicSaSaModelAdapter(),
  now = () => Date.now(),
  createId = () => crypto.randomUUID(),
  turnDeadlineMs = saSaAgentLimits.turnDeadlineMs,
  dailySpendLimitCents = Number.POSITIVE_INFINITY,
  reservedTurnCostCents = 0
}: SaSaAgentGatewayOptions = {}): SaSaAgentGateway {
  const sessions = new Map<string, SaSaSession>();
  const reservedDailySpend = new Map<string, number>();

  function reserveTurnBudget() {
    const day = new Date(now()).toISOString().slice(0, 10);
    const reserved = reservedDailySpend.get(day) ?? 0;
    if (reserved + reservedTurnCostCents > dailySpendLimitCents) return false;
    reservedDailySpend.set(day, reserved + reservedTurnCostCents);
    return true;
  }

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
    sessions.set(id, { id, expiresAt, activeTurnId: null, completedTurns: new Map(), recentTurnStarts: [], usage: { inputTokens: 0, outputTokens: 0 } });
    return { id, expiresAt: new Date(expiresAt).toISOString(), mode };
  }

  function getSession(id: string | undefined) {
    purgeExpiredSessions();
    return id ? sessions.get(id) ?? null : null;
  }

  async function* streamTurn(request: SaSaTurnRequest, signal?: AbortSignal): AsyncGenerator<SaSaAgentEvent> {
    const session = getSession(request.sessionId);
    const turnId = createId();
    let sequence = 0;
    const event = (payload: SaSaAgentEventPayload): SaSaAgentEvent => ({
      version: saSaContractVersion,
      sessionId: session?.id ?? "invalid",
      turnId,
      sequence: ++sequence,
      createdAt: new Date(now()).toISOString(),
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
      yield event({ type: "failed", code: "agent-disabled", message: "Sa-Sa's live guide is not enabled right now. You can still use the portfolio navigation.", retryable: false });
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
      yield event({ type: "failed", code: "policy-denied", message: "I can only help with the approved public portfolio information and registered page actions.", retryable: false });
      return;
    }
    if (!reserveTurnBudget()) {
      yield event({ type: "failed", code: "rate-limited", message: "Sa-Sa has reached today's public-guide budget.", retryable: true });
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
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort(signal?.reason);
    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener("abort", abort, { once: true });
    }
    const deadline = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, turnDeadlineMs);

    try {
      if (controller.signal.aborted) {
        yield emit({ type: "failed", code: "cancelled", message: "Sa-Sa stopped that answer.", retryable: true });
        return;
      }
      yield emit({ type: "accepted", message: "Sa-Sa is checking the public portfolio." });
      yield emit({ type: "behavior-requested", behavior: "thinking" });

      let toolCalls = 0;
      let outputCharacters = 0;
      const sources: SaSaSourceReference[] = [];
      for await (const output of adapter.streamTurn({ message: request.message, context: request.context }, controller.signal)) {
        if (controller.signal.aborted) {
          yield emit({ type: "failed", code: timedOut ? "timeout" : "cancelled", message: timedOut ? "Sa-Sa's guide took too long to answer." : "Sa-Sa stopped that answer.", retryable: true });
          return;
        }
        if (!isRecord(output) || typeof output.type !== "string") {
          yield emit({ type: "failed", code: "provider-output-invalid", message: "Sa-Sa received an invalid guide response.", retryable: true });
          return;
        }

        if (output.type === "tool-call") {
          const call = validateSaSaToolCall(output.call);
          if (!call.success || toolCalls >= saSaAgentLimits.maxToolCallsPerTurn) {
            yield emit({ type: "failed", code: "policy-denied", message: "Sa-Sa could not use that requested capability.", retryable: false });
            return;
          }
          toolCalls += 1;
          yield emit({ type: "behavior-requested", behavior: "acting" });
          yield emit({ type: "tool-started", tool: call.data.id, label: "Checking public portfolio facts" });
          const result = runPortfolioKnowledgeTool(call.data);
          if (result) sources.push(...result.sources);
          yield emit({ type: "tool-completed", tool: call.data.id, sources: result?.sources ?? [] });
          continue;
        }

        if (output.type === "action-proposed") {
          const action = validateSaSaPageActionProposal(output.action);
          if (!action.success || !request.context.availableActionIds.includes(action.data.actionId)) {
            yield emit({ type: "failed", code: "policy-denied", message: "Sa-Sa could not use that requested page action.", retryable: false });
            return;
          }
          yield emit({ type: "action-proposed", action: action.data });
          continue;
        }

        if (output.type === "behavior-requested") {
          const behavior = validateSaSaBehaviorCue(output.behavior);
          if (!behavior.success) {
            yield emit({ type: "failed", code: "provider-output-invalid", message: "Sa-Sa received an invalid behavior request.", retryable: true });
            return;
          }
          yield emit({ type: "behavior-requested", behavior: behavior.data });
          continue;
        }

        if (isTextDelta(output)) {
          outputCharacters += output.delta.length;
          if (outputCharacters > saSaAgentLimits.maxOutputCharacters) {
            yield emit({ type: "failed", code: "policy-denied", message: "Sa-Sa's response exceeded its public-answer limit.", retryable: true });
            return;
          }
          yield emit({ type: "behavior-requested", behavior: "speaking" });
          yield emit({ type: "text-delta", delta: output.delta });
          continue;
        }

        if (isUsage(output)) {
          session.usage.inputTokens += output.inputTokens;
          session.usage.outputTokens += output.outputTokens;
          continue;
        }

        if (output.type !== "usage") {
          yield emit({ type: "failed", code: "provider-output-invalid", message: "Sa-Sa received an unsupported guide response.", retryable: true });
          return;
        }
        yield emit({ type: "failed", code: "provider-output-invalid", message: "Sa-Sa received invalid usage information.", retryable: true });
        return;
      }

      if (controller.signal.aborted) {
        yield emit({ type: "failed", code: timedOut ? "timeout" : "cancelled", message: timedOut ? "Sa-Sa's guide took too long to answer." : "Sa-Sa stopped that answer.", retryable: true });
        return;
      }

      yield emit({ type: "behavior-requested", behavior: "success" });
      yield emit({ type: "completed", sources });
      session.completedTurns.set(request.clientTurnId, emitted);
    } catch {
      yield emit({ type: "failed", code: timedOut ? "timeout" : "provider-failure", message: timedOut ? "Sa-Sa's guide took too long to answer." : "Sa-Sa could not reach the public guide just now.", retryable: true });
    } finally {
      clearTimeout(deadline);
      signal?.removeEventListener("abort", abort);
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
