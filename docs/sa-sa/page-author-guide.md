# Sa-Sa page-author guide

Pages integrate Sa-Sa by registering semantic scene data and their own DOM refs. Page code never edits the behavior runtime, asset renderer, or agent gateway.

## Minimum integration

```tsx
const productScene = {
  id: "product",
  priority: 20,
  anchors: [{ id: "product-dock", placement: "inline-end", availability: "all" }],
  safeZones: [{ id: "product-actions" }],
  content: [{ type: "project", id: "portfolio" }],
  actions: [{ id: "scroll-to-section", label: "Show a page section" }]
} as const;

function ProductPage() {
  const dockRef = useSaSaAnchor("product-dock");
  const actionsRef = useSaSaSafeZone("product-actions");

  const isAboutAction = (input) => Object.keys(input).length === 1 && input.sectionId === "about";
  useSaSaPageAction(
    "scroll-to-section",
    (input) => document.getElementById(input.sectionId)?.scrollIntoView({ block: "start" }),
    isAboutAction
  );

  return (
    <>
      <SaSaScene scene={productScene} />
      <aside ref={dockRef}>…</aside>
      <div ref={actionsRef}>…</div>
    </>
  );
}
```

`SaSaScene` is mounted/unmounted with the page, so a route or overlay cleans itself up automatically. Anchors and safe zones are refs to page-owned elements; the framework never queries selectors or keeps a second layout map.

## Scroll-aware section scenes

For a section that should temporarily take priority while it is visible, use `useSaSaSectionScene`. Attach its returned ref to the same public element as the anchor ref. Home's Writing section is the reference implementation.

```tsx
const anchorRef = useSaSaAnchor("writing-dock");
const sceneRef = useSaSaSectionScene(writingScene);

const combinedRef = useCallback((element: HTMLDivElement | null) => {
  anchorRef(element);
  sceneRef(element);
}, [anchorRef, sceneRef]);
```

The observer only registers the scene while at least 25% of its element is visible. The highest-priority currently registered scene is the sole source for agent context and page actions.

## Rules for actions and context

- Every action has a stable ID in the scene, a handler, and a page-owned input validator registered by `useSaSaPageAction`. The shared contract validates bounded payload shape; the page validator owns the action-specific semantics.
- Action handlers must be local, reversible presentation/navigation work. Their validator must allow only bounded semantic input such as `{ sectionId: "about" }`, never selectors, URLs, callbacks, code, or asset IDs. The registry returns typed `unavailable`, `denied`, `timed-out`, or `failed` results without breaking the conversation.
- Only the active scene’s action IDs and content references enter `SaSaPageContext`.
- `content` may name a public `section`, `project`, `feed-item`, or `document`; never pass HTML, drafts, selected text, private data, or arbitrary URLs.
- A missing ref, unavailable desktop-only anchor, or absent action handler safely falls back to the viewport dock or an unavailable result.

## Test responsibility

Each new integration needs a scene-priority/context test and a placement fixture covering its anchor, safe zone, and smallest supported viewport. The shared tests live beside the feature under `apps/web/src/features/sa-sa/`.
