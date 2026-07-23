/**
 * Dependency-free protocol shared by the web app and the agent gateway.
 * It intentionally excludes React, DOM, renderer, model-provider, and URL-fetching concepts.
 */
export const saSaContractVersion = 1 as const;

export const saSaContentReferenceTypes = ["section", "project", "feed-item", "document"] as const;
export type SaSaContentReferenceType = (typeof saSaContentReferenceTypes)[number];

export type SaSaContentReference = {
  type: SaSaContentReferenceType;
  id: string;
};

export type SaSaPageContext = {
  version: typeof saSaContractVersion;
  sceneId: string | null;
  activeAnchorIds: readonly string[];
  availableActionIds: readonly string[];
  content: readonly SaSaContentReference[];
  locale: string;
  reducedMotion: boolean;
};

export type SaSaTurnRequest = {
  version: typeof saSaContractVersion;
  clientTurnId: string;
  message: string;
  sessionId?: string;
  context: SaSaPageContext;
};

export const saSaToolIds = ["get-profile", "list-projects", "get-project", "search-build-log", "get-build-log-item"] as const;
export type SaSaToolId = (typeof saSaToolIds)[number];

export type SaSaToolCall = {
  id: SaSaToolId;
  input: Record<string, string>;
};

export type SaSaSourceReference = {
  id: string;
  title: string;
  href: string;
  freshness: "static" | "live";
};

export type SaSaPageActionProposal = {
  actionId: string;
  label: string;
  input: SaSaPageActionInput;
};

export type SaSaPageActionInput = Record<string, string>;

export type SaSaPageActionResult = {
  actionId: string;
  outcome: "completed" | "unavailable" | "denied" | "timed-out" | "failed";
  message: string;
};

export type SaSaBehaviorCue = "thinking" | "acting" | "speaking" | "success" | "error" | "offline";

export type SaSaAgentEventPayload =
  | { type: "accepted"; message: string }
  | { type: "text-delta"; delta: string }
  | { type: "tool-started"; tool: SaSaToolId; label: string }
  | { type: "tool-completed"; tool: SaSaToolId; sources: readonly SaSaSourceReference[] }
  | { type: "behavior-requested"; behavior: SaSaBehaviorCue }
  | { type: "action-proposed"; action: SaSaPageActionProposal }
  | { type: "completed"; sources: readonly SaSaSourceReference[] }
  | { type: "failed"; code: SaSaAgentFailureCode; message: string; retryable: boolean };

export type SaSaAgentFailureCode =
  | "agent-disabled"
  | "invalid-request"
  | "rate-limited"
  | "session-busy"
  | "unavailable"
  | "cancelled"
  | "policy-denied";

export type SaSaAgentEvent = {
  version: typeof saSaContractVersion;
  sessionId: string;
  turnId: string;
  sequence: number;
  createdAt: string;
  payload: SaSaAgentEventPayload;
};

export const saSaAgentLimits = {
  maxMessageCharacters: 1200,
  maxClientTurnIdCharacters: 96,
  maxContextItems: 12,
  maxActionIds: 16,
  maxToolCallsPerTurn: 3,
  turnDeadlineMs: 15_000
} as const;

export type SaSaValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: readonly string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength = 160): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isStringArray(value: unknown, maxLength: number) {
  return Array.isArray(value) && value.length <= maxLength && value.every((entry) => isNonEmptyString(entry));
}

function isBoundedStringRecord(value: unknown, maxEntries = 8): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.keys(value).length <= maxEntries &&
    Object.entries(value).every(([key, entry]) => isNonEmptyString(key, 64) && typeof entry === "string" && entry.length <= 160)
  );
}

export function validateSaSaPageActionInput(value: unknown): SaSaValidationResult<SaSaPageActionInput> {
  return isBoundedStringRecord(value)
    ? { success: true, data: value }
    : { success: false, issues: ["Page action inputs must be bounded strings."] };
}

export function isSafePublicHref(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("/") || value.startsWith("https://brysonbenjamin.com/"))
  );
}

export function parseSaSaPageContext(value: unknown): SaSaValidationResult<SaSaPageContext> {
  if (!isRecord(value)) return { success: false, issues: ["Context must be an object."] };
  const issues: string[] = [];

  if (value.version !== saSaContractVersion) issues.push("Unsupported context version.");
  if (value.sceneId !== null && !isNonEmptyString(value.sceneId)) issues.push("Invalid scene id.");
  if (!isStringArray(value.activeAnchorIds, saSaAgentLimits.maxContextItems)) issues.push("Invalid active anchors.");
  if (!isStringArray(value.availableActionIds, saSaAgentLimits.maxActionIds)) issues.push("Invalid available actions.");
  if (!isNonEmptyString(value.locale, 32)) issues.push("Invalid locale.");
  if (typeof value.reducedMotion !== "boolean") issues.push("Invalid reduced-motion setting.");
  if (!Array.isArray(value.content) || value.content.length > saSaAgentLimits.maxContextItems) {
    issues.push("Invalid public content references.");
  } else if (
    !value.content.every(
      (reference) =>
        isRecord(reference) &&
        typeof reference.type === "string" &&
        saSaContentReferenceTypes.includes(reference.type as SaSaContentReferenceType) &&
        isNonEmptyString(reference.id)
    )
  ) {
    issues.push("Invalid public content reference.");
  }

  return issues.length
    ? { success: false, issues }
    : {
        success: true,
        data: value as SaSaPageContext
      };
}

export function parseSaSaTurnRequest(value: unknown): SaSaValidationResult<SaSaTurnRequest> {
  if (!isRecord(value)) return { success: false, issues: ["Turn request must be an object."] };
  const context = parseSaSaPageContext(value.context);
  if (!context.success) return { success: false, issues: context.issues };

  const clientTurnId = value.clientTurnId;
  const message = value.message;
  const sessionId = value.sessionId;
  const issues: string[] = [];

  if (value.version !== saSaContractVersion) issues.push("Unsupported turn version.");
  if (!isNonEmptyString(clientTurnId, saSaAgentLimits.maxClientTurnIdCharacters)) issues.push("Invalid client turn id.");
  if (!isNonEmptyString(message, saSaAgentLimits.maxMessageCharacters)) issues.push("Invalid message.");
  if (sessionId !== undefined && !isNonEmptyString(sessionId, 128)) issues.push("Invalid session id.");

  return issues.length
    ? { success: false, issues }
    : {
        success: true,
        data: {
          version: saSaContractVersion,
          clientTurnId: clientTurnId as string,
          message: (message as string).trim(),
          ...(sessionId ? { sessionId: sessionId as string } : {}),
          context: context.data
        }
      };
}

export function validateSaSaSourceReference(value: unknown): SaSaValidationResult<SaSaSourceReference> {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !isSafePublicHref(value.href) ||
    (value.freshness !== "static" && value.freshness !== "live")
  ) {
    return { success: false, issues: ["Invalid source reference."] };
  }

  return { success: true, data: value as SaSaSourceReference };
}

export function validateSaSaToolCall(value: unknown): SaSaValidationResult<SaSaToolCall> {
  if (!isRecord(value) || !saSaToolIds.includes(value.id as SaSaToolId) || !isRecord(value.input)) {
    return { success: false, issues: ["Unknown tool or invalid tool input."] };
  }

  if (!isBoundedStringRecord(value.input)) {
    return { success: false, issues: ["Tool inputs must be bounded strings."] };
  }

  return { success: true, data: value as SaSaToolCall };
}

export function validateSaSaPageActionProposal(value: unknown): SaSaValidationResult<SaSaPageActionProposal> {
  if (!isRecord(value) || !isNonEmptyString(value.actionId) || !isNonEmptyString(value.label)) {
    return { success: false, issues: ["Invalid page action proposal."] };
  }

  const input = validateSaSaPageActionInput(value.input);
  if (!input.success) return input;

  return { success: true, data: { ...value, input: input.data } as SaSaPageActionProposal };
}
