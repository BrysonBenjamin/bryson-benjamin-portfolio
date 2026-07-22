import {
  parseSaSaPageContext,
  saSaContractVersion,
  type SaSaContentReference,
  type SaSaPageContext
} from "@bryson-benjamin/sa-sa-contracts";

export type SaSaAnchorDefinition = {
  id: string;
  placement: "inline-end" | "inline-start" | "block-end";
  availability: "all" | "desktop";
};

export type SaSaSafeZoneDefinition = {
  id: string;
};

export type SaSaPublicContentReference = SaSaContentReference;

export type SaSaPageActionDefinition = {
  id: string;
  label: string;
};

export type SaSaSceneDefinition = {
  id: string;
  priority: number;
  anchors: readonly SaSaAnchorDefinition[];
  safeZones: readonly SaSaSafeZoneDefinition[];
  content: readonly SaSaPublicContentReference[];
  actions: readonly SaSaPageActionDefinition[];
};

export type SaSaContextSnapshot = {
  activeSceneId: string | null;
  sceneIds: readonly string[];
  anchorIds: readonly string[];
  anchors: readonly SaSaAnchorDefinition[];
  safeZoneIds: readonly string[];
  availableActionIds: readonly string[];
  content: readonly SaSaPublicContentReference[];
};

export function validateSaSaScene(scene: SaSaSceneDefinition) {
  const ids = new Set<string>();

  for (const anchor of scene.anchors) {
    if (ids.has(anchor.id)) {
      throw new Error(`Sa-Sa scene \"${scene.id}\" has a duplicate anchor \"${anchor.id}\".`);
    }
    ids.add(anchor.id);
  }

  for (const zone of scene.safeZones) {
    if (ids.has(zone.id)) {
      throw new Error(`Sa-Sa scene \"${scene.id}\" reuses \"${zone.id}\" as an anchor and safe zone.`);
    }
    ids.add(zone.id);
  }

  if (scene.priority < 0) {
    throw new Error(`Sa-Sa scene \"${scene.id}\" cannot have a negative priority.`);
  }
}

export function createSaSaContextSnapshot(scenes: readonly SaSaSceneDefinition[]): SaSaContextSnapshot {
  const orderedScenes = [...scenes].sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
  const activeScene = orderedScenes[0] ?? null;

  return {
    activeSceneId: activeScene?.id ?? null,
    sceneIds: orderedScenes.map((scene) => scene.id),
    anchorIds: activeScene?.anchors.map((anchor) => anchor.id) ?? [],
    anchors: activeScene?.anchors ?? [],
    safeZoneIds: activeScene?.safeZones.map((zone) => zone.id) ?? [],
    availableActionIds: activeScene?.actions.map((action) => action.id) ?? [],
    content: activeScene?.content ?? []
  };
}

/** Converts page-owned scene state into the small, validated context that may reach the agent. */
export function createSaSaAgentContext(
  snapshot: SaSaContextSnapshot,
  options: Pick<SaSaPageContext, "locale" | "reducedMotion">
): SaSaPageContext {
  const parsed = parseSaSaPageContext({
    version: saSaContractVersion,
    sceneId: snapshot.activeSceneId,
    activeAnchorIds: snapshot.anchorIds,
    availableActionIds: snapshot.availableActionIds,
    content: snapshot.content,
    ...options
  });

  if (!parsed.success) {
    throw new Error(`Invalid Sa-Sa agent context: ${parsed.issues.join(" ")}`);
  }

  return parsed.data;
}
