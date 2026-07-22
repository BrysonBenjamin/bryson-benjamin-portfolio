import { getSaSaAssetState, saSaAssetManifest, type SaSaState } from "../../components/brand/saSaAssets";

export type SaSaRenderRequest = {
  behavior: SaSaState;
  failed: boolean;
};

export type SaSaRenderPlan = {
  behavior: SaSaState;
  descriptor: ReturnType<typeof getSaSaAssetState>;
};

/**
 * The runtime only asks for a semantic behavior. A renderer adapter resolves that
 * behavior into its own output type, leaving the runtime and page scenes renderer-agnostic.
 */
export type SaSaRendererAdapter<Output> = {
  resolve: (request: SaSaRenderRequest) => Output;
  fallback: () => Output;
};

export const pixelAssetRenderer: SaSaRendererAdapter<SaSaRenderPlan> = {
  resolve({ behavior, failed }) {
    const resolvedBehavior = failed ? saSaAssetManifest.staticFallback : behavior;
    return { behavior: resolvedBehavior, descriptor: getSaSaAssetState(resolvedBehavior) };
  },
  fallback() {
    const behavior = saSaAssetManifest.staticFallback;
    return { behavior, descriptor: getSaSaAssetState(behavior) };
  }
};
