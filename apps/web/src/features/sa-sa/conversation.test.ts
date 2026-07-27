import { saSaContractVersion, type SaSaAgentEvent } from "@bryson-benjamin/sa-sa-contracts";
import { describe, expect, it } from "vitest";
import { createEmptySaSaConversationState, reduceSaSaConversation } from "./conversation";

const session = { id: "session-1", expiresAt: "2026-07-24T00:00:00.000Z", mode: "deterministic" as const };

function event(payload: SaSaAgentEvent["payload"]): SaSaAgentEvent {
  return {
    version: saSaContractVersion,
    sessionId: session.id,
    turnId: "turn-1",
    sequence: 1,
    createdAt: "2026-07-23T00:00:00.000Z",
    payload
  };
}

function started() {
  return reduceSaSaConversation(createEmptySaSaConversationState(), {
    type: "started",
    session,
    turnId: "turn-1",
    message: "What are you building?"
  });
}

describe("Sa-Sa conversation lifecycle", () => {
  it("returns from tool, action, and streamed-result work to a stable idle state", () => {
    let state = started();
    state = reduceSaSaConversation(state, { type: "event", event: event({ type: "behavior-requested", behavior: "acting" }) });
    state = reduceSaSaConversation(state, {
      type: "event",
      event: event({ type: "tool-started", tool: "get-profile", label: "Checking public facts" })
    });
    state = reduceSaSaConversation(state, {
      type: "action-result",
      result: { actionId: "scroll-to-section", outcome: "completed", message: "Done." }
    });
    state = reduceSaSaConversation(state, { type: "event", event: event({ type: "behavior-requested", behavior: "speaking" }) });
    state = reduceSaSaConversation(state, { type: "event", event: event({ type: "text-delta", delta: "Here it is." }) });
    state = reduceSaSaConversation(state, { type: "event", event: event({ type: "completed", sources: [] }) });

    expect(state).toMatchObject({
      status: "success",
      isStreaming: false,
      actionResult: { outcome: "completed" },
      messages: [{ role: "user", complete: true }, { role: "assistant", text: "Here it is.", complete: true }]
    });
    expect(reduceSaSaConversation(state, { type: "settle" })).toMatchObject({ status: "idle", isStreaming: false });
  });

  it("returns cancel, gateway failure, and network failure paths to stable states", () => {
    const cancelled = reduceSaSaConversation(started(), { type: "cancelled" });
    expect(cancelled).toMatchObject({ status: "idle", isStreaming: false, messages: [{ role: "user", complete: true }] });

    const gatewayFailure = reduceSaSaConversation(started(), {
      type: "event",
      event: event({ type: "failed", code: "agent-disabled", message: "Unavailable", retryable: false })
    });
    expect(gatewayFailure).toMatchObject({ status: "offline", isStreaming: false, error: "Unavailable" });

    const networkFailure = reduceSaSaConversation(started(), { type: "network-failed", message: "Network unavailable" });
    expect(networkFailure).toMatchObject({ status: "offline", isStreaming: false, error: "Network unavailable" });
  });
});
