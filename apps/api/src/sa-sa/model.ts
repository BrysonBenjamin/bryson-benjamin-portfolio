import type { SaSaPageActionProposal, SaSaToolCall, SaSaTurnRequest } from "@bryson-benjamin/sa-sa-contracts";

export type SaSaModelTurn = Pick<SaSaTurnRequest, "message" | "context">;

/** Provider-native events are normalized here and never cross into shared contracts or the browser. */
export type SaSaModelAdapter = {
  id: string;
  streamTurn: (turn: SaSaModelTurn, signal: AbortSignal) => AsyncIterable<unknown>;
};

type OpenAiAdapterOptions = {
  apiKey: string;
  model: string;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
};

function textChunks(text: string) {
  return text.match(/.{1,92}(?:\s|$)/g) ?? [text];
}

function determineTools(message: string): readonly SaSaToolCall[] {
  if (/\b(what|which).{0,50}\b(build|building|work|project)/i.test(message)) {
    return [{ id: "get-profile", input: {} }, { id: "list-projects", input: {} }];
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

function determineAction(turn: SaSaModelTurn): SaSaPageActionProposal | null {
  if (/\b(open|show).{0,30}\b(second|2nd|work|project)/i.test(turn.message)) {
    return turn.context.availableActionIds.includes("scroll-to-section")
      ? { actionId: "scroll-to-section", label: "Show selected work", input: { sectionId: "work" } }
      : null;
  }

  if (/\b(about|who is bryson)\b/i.test(turn.message)) {
    return turn.context.availableActionIds.includes("scroll-to-section")
      ? { actionId: "scroll-to-section", label: "Show about Bryson", input: { sectionId: "about" } }
      : null;
  }

  return null;
}

function answerFor(turn: SaSaModelTurn, action: SaSaPageActionProposal | null) {
  if (action) {
    return action.input.sectionId === "work"
      ? "I found the second project: Linear feed bridge. I can take you to the selected work section."
      : "I can take you to the public About section.";
  }
  if (/\b(what|which).{0,50}\b(build|building|work|project)/i.test(turn.message)) {
    return "Bryson is building a public portfolio that connects product planning, documentation, and a public build log. The current work also includes a label-gated Linear feed bridge and a small personal design system.";
  }
  return "I only know the public portfolio facts that are available on this site.";
}

/** A deterministic adapter is the CI default and mirrors the approved MVP journey without provider credentials. */
export function createDeterministicSaSaModelAdapter(): SaSaModelAdapter {
  return {
    id: "deterministic",
    async *streamTurn(turn, signal) {
      for (const call of determineTools(turn.message)) {
        if (signal.aborted) return;
        yield { type: "tool-call", call };
      }

      const action = determineAction(turn);
      if (action) yield { type: "action-proposed", action };
      for (const delta of textChunks(answerFor(turn, action))) {
        if (signal.aborted) return;
        yield { type: "text-delta", delta };
      }
      yield { type: "usage", inputTokens: Math.ceil(turn.message.length / 4), outputTokens: 48 };
    }
  };
}

/** Test adapter for malformed output, provider failure, timing, and cancellation fixtures. */
export function createScriptedSaSaModelAdapter(id: string, events: readonly unknown[]): SaSaModelAdapter {
  return {
    id,
    async *streamTurn(_turn, signal) {
      for (const event of events) {
        if (signal.aborted) return;
        if (event instanceof Error) throw event;
        yield event;
      }
    }
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readOpenAiContent(value: unknown) {
  const response = asRecord(value);
  const choices = Array.isArray(response?.choices) ? response.choices : [];
  const choice = asRecord(choices[0]);
  const message = asRecord(choice?.message);
  return typeof message?.content === "string" ? message.content : null;
}

/**
 * Optional server-only OpenAI adapter. It requests a small JSON object, then the
 * gateway revalidates every proposed capability before anything reaches a tool or page.
 */
export function createOpenAiSaSaModelAdapter({ apiKey, model, fetchImpl = fetch }: OpenAiAdapterOptions): SaSaModelAdapter {
  return {
    id: `openai:${model}`,
    async *streamTurn(turn, signal) {
      const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          store: false,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are Sa-Sa, a concise guide to Bryson Benjamin's public portfolio. Return JSON only with text (string), toolCalls (array of {id,input}), action (object or null), and behavior (string or null). Use only the supplied public context. Never provide URLs, selectors, assets, code, or private data."
            },
            { role: "user", content: JSON.stringify({ message: turn.message, context: turn.context }) }
          ]
        })
      });
      if (!response.ok) throw new Error("OpenAI request failed.");
      const completion = await response.json();
      const content = readOpenAiContent(completion);
      if (!content) throw new Error("OpenAI returned no structured content.");
      const output = asRecord(JSON.parse(content));
      if (!output) throw new Error("OpenAI returned malformed structured content.");

      if (Array.isArray(output.toolCalls)) {
        for (const call of output.toolCalls) yield { type: "tool-call", call };
      }
      if (output.action !== null && output.action !== undefined) yield { type: "action-proposed", action: output.action };
      if (output.behavior !== null && output.behavior !== undefined) yield { type: "behavior-requested", behavior: output.behavior };
      if (typeof output.text === "string") {
        for (const delta of textChunks(output.text)) yield { type: "text-delta", delta };
      }
      const usage = asRecord(asRecord(completion)?.usage);
      yield {
        type: "usage",
        inputTokens: typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : 0,
        outputTokens: typeof usage?.completion_tokens === "number" ? usage.completion_tokens : 0
      };
    }
  };
}
