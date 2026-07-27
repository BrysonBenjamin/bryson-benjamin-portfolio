import {
  validateSaSaPageActionInput,
  type SaSaPageActionInput,
  type SaSaPageActionResult
} from "@bryson-benjamin/sa-sa-contracts";

export type SaSaPageActionHandler = (input: SaSaPageActionInput, signal: AbortSignal) => void | Promise<void>;
export type SaSaPageActionInputValidator = (input: SaSaPageActionInput) => boolean;

type SaSaPageActionRegistration = {
  handler: SaSaPageActionHandler;
  validateInput: SaSaPageActionInputValidator;
};

type SaSaPageActionRegistryOptions = {
  timeoutMs?: number;
};

const defaultTimeoutMs = 1_500;

export function isEmptySaSaPageActionInput(input: SaSaPageActionInput) {
  return Object.keys(input).length === 0;
}

/**
 * Keeps model output at a page-owned boundary: a scene allows an action, and
 * the page validates the action's small semantic input before it can run.
 */
export function createSaSaPageActionRegistry({ timeoutMs = defaultTimeoutMs }: SaSaPageActionRegistryOptions = {}) {
  const actions = new Map<string, SaSaPageActionRegistration>();

  function register(id: string, handler: SaSaPageActionHandler, validateInput: SaSaPageActionInputValidator) {
    actions.set(id, { handler, validateInput });

    return () => {
      if (actions.get(id)?.handler === handler) actions.delete(id);
    };
  }

  async function run(
    id: unknown,
    input: unknown,
    availableActionIds: readonly string[]
  ): Promise<SaSaPageActionResult> {
    const actionId = typeof id === "string" ? id : "unknown";
    if (!availableActionIds.includes(actionId)) {
      return { actionId, outcome: "unavailable", message: "That action is not available on this part of the site." };
    }

    const registration = actions.get(actionId);
    if (!registration) {
      return { actionId, outcome: "unavailable", message: "That page action is not ready right now." };
    }

    const parsedInput = validateSaSaPageActionInput(input);
    if (!parsedInput.success) {
      return { actionId, outcome: "denied", message: "That page action used invalid input." };
    }

    try {
      if (!registration.validateInput(parsedInput.data)) {
        return { actionId, outcome: "denied", message: "That page action is not allowed with those details." };
      }
    } catch {
      return { actionId, outcome: "denied", message: "That page action is not allowed with those details." };
    }

    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      await new Promise<void>((resolve, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("Sa-Sa page action timed out."));
        }, timeoutMs);
        Promise.resolve(registration.handler(parsedInput.data, controller.signal)).then(resolve, reject);
      });
      return { actionId, outcome: "completed", message: "Done." };
    } catch {
      if (controller.signal.aborted) {
        return { actionId, outcome: "timed-out", message: "That page action took too long to complete." };
      }
      return { actionId, outcome: "failed", message: "That page action could not be completed." };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  return { register, run };
}
