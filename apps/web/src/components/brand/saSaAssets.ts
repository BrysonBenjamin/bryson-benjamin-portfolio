import errorImage from "../../assets/sa-sa/sa-sa-emotion-error.png";
import idleImage from "../../assets/sa-sa/sa-sa-emotion-idle.png";
import successImage from "../../assets/sa-sa/sa-sa-emotion-success.png";
import thinkingImage from "../../assets/sa-sa/sa-sa-emotion-thinking.png";
import loafBaseImage from "../../assets/sa-sa/sa-sa-loaf-base.png";
import loafBreatheImage from "../../assets/sa-sa/sa-sa-loaf-breathe-overlay.png";
import loafTailDownImage from "../../assets/sa-sa/sa-sa-loaf-tail-down.png";
import loafTailMidImage from "../../assets/sa-sa/sa-sa-loaf-tail-mid.png";
import loafTailUpImage from "../../assets/sa-sa/sa-sa-loaf-tail-up.png";
import type { SaSaBehavior } from "../../features/sa-sa/contracts";

export type SaSaState = SaSaBehavior;

type StaticLayer = {
  id: string;
  image: string;
  animation?: "breathe";
};

type SequenceLayer = {
  id: string;
  frames: readonly string[];
  intervalMs: number;
};

export type SaSaAssetLayer = StaticLayer | SequenceLayer;

export type SaSaAssetManifest = {
  version: string;
  canvas: {
    width: number;
    height: number;
    pixelArt: true;
  };
  staticFallback: "idle";
  states: Record<SaSaState, { layers: readonly SaSaAssetLayer[] }>;
};

export const saSaAssetManifest: SaSaAssetManifest = {
  version: "v1",
  canvas: {
    width: 100,
    height: 100,
    pixelArt: true
  },
  staticFallback: "idle",
  states: {
    idle: {
      layers: [{ id: "actor", image: idleImage }]
    },
    reacting: {
      layers: [{ id: "actor", image: successImage }]
    },
    thinking: {
      layers: [{ id: "actor", image: thinkingImage }]
    },
    speaking: {
      layers: [{ id: "actor", image: idleImage }]
    },
    acting: {
      layers: [{ id: "actor", image: thinkingImage }]
    },
    walking: {
      layers: [{ id: "actor", image: idleImage }]
    },
    arriving: {
      layers: [{ id: "actor", image: successImage }]
    },
    success: {
      layers: [{ id: "actor", image: successImage }]
    },
    error: {
      layers: [{ id: "actor", image: errorImage }]
    },
    offline: {
      layers: [{ id: "actor", image: errorImage }]
    },
    loafing: {
      layers: [
        { id: "body", image: loafBaseImage },
        { id: "breathe", image: loafBreatheImage, animation: "breathe" },
        {
          id: "tail",
          frames: [loafTailMidImage, loafTailUpImage, loafTailMidImage, loafTailDownImage],
          intervalMs: 320
        }
      ]
    }
  }
};

export function getSaSaAssetState(state: SaSaState) {
  return saSaAssetManifest.states[state];
}

export function isSaSaSequenceLayer(layer: SaSaAssetLayer): layer is SequenceLayer {
  return "frames" in layer;
}

export function validateSaSaAssetManifest(manifest: SaSaAssetManifest = saSaAssetManifest) {
  if (manifest.canvas.width !== 100 || manifest.canvas.height !== 100) {
    throw new Error("Sa-Sa assets must use the canonical 100×100 canvas.");
  }

  for (const [state, descriptor] of Object.entries(manifest.states)) {
    const layerIds = new Set<string>();

    for (const layer of descriptor.layers) {
      if (layerIds.has(layer.id)) {
        throw new Error(`Sa-Sa state \"${state}\" has duplicate layer id \"${layer.id}\".`);
      }

      layerIds.add(layer.id);

      if (isSaSaSequenceLayer(layer) && (layer.frames.length < 2 || layer.intervalMs <= 0)) {
        throw new Error(`Sa-Sa sequence layer \"${layer.id}\" must have at least two frames and a positive interval.`);
      }
    }
  }
}
