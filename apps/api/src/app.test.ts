import { saSaContractVersion } from "@bryson-benjamin/sa-sa-contracts";
import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("Sa-Sa SSE route", () => {
  it("emits an accepted event before the completed event", async () => {
    const sessionResponse = await app.request("/api/sa-sa/session", { method: "POST" });
    const session = (await sessionResponse.json()) as { id: string };
    const response = await app.request("/api/sa-sa/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        version: saSaContractVersion,
        sessionId: session.id,
        clientTurnId: "sse-order",
        message: "What are you building?",
        context: {
          version: saSaContractVersion,
          sceneId: "home",
          activeAnchorIds: [],
          availableActionIds: [],
          content: [{ type: "section", id: "work" }],
          locale: "en-US",
          reducedMotion: false
        }
      })
    });

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    const first = await reader!.read();
    const firstChunk = new TextDecoder().decode(first.value);

    expect(first.done).toBe(false);
    expect(firstChunk).toContain('"type":"accepted"');
    expect(firstChunk).not.toContain('"type":"completed"');
    await reader!.cancel();
  });
});
