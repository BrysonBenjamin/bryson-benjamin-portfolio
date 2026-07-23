import { describe, expect, it, vi } from "vitest";
import { createOpenAiSaSaModelAdapter } from "./model";

async function collect<T>(stream: AsyncIterable<T>) {
  const values: T[] = [];
  for await (const value of stream) values.push(value);
  return values;
}

describe("OpenAI Sa-Sa adapter", () => {
  it("keeps provider payloads inside the adapter and normalizes semantic events", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  text: "Here is the public work.",
                  toolCalls: [{ id: "list-projects", input: {} }],
                  action: null,
                  behavior: "speaking"
                })
              }
            }
          ]
        })
      )
    );
    const adapter = createOpenAiSaSaModelAdapter({ apiKey: "test-key", model: "test-model", fetchImpl });
    const events = await collect(
      adapter.streamTurn(
        { message: "What are you building?", context: { version: 1, sceneId: null, activeAnchorIds: [], availableActionIds: [], content: [], locale: "en-US", reducedMotion: false } },
        new AbortController().signal
      )
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-key" }) })
    );
    expect(events).toEqual(expect.arrayContaining([{ type: "tool-call", call: { id: "list-projects", input: {} } }, { type: "text-delta", delta: "Here is the public work." }]));
  });
});
