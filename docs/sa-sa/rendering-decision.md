# Sa-Sa research and rendering decision

## Observed product patterns

| Reference | Observable pattern | Sa-Sa implication |
| --- | --- | --- |
| [GitHub mascot guidance](https://brand.github.com/graphic-elements/mascots) | Mascots have defined brand roles and usage constraints. | Treat the canonical actor and decorative marks as distinct responsibilities. |
| [ChatGPT Canvas](https://openai.com/index/introducing-canvas/) | A focused workspace is entered deliberately for complex collaboration. | Opening Sa-Sa chat must be intentional and should not interrupt reading. |
| [Apps in ChatGPT](https://openai.com/index/introducing-apps-in-chatgpt/) | Contextual tools are surfaced within conversation with an explicit connection/consent moment. | Page actions require a visible explanation and an allowlisted contract. |

These references describe public behavior; they do not imply knowledge of the products' internal implementations.

## Rendering matrix

| Approach | Strength | Risk for Sa-Sa | Decision |
| --- | --- | --- | --- |
| Layered PNG/WebP | Exact pixel control, tiny current frames, browser-native loading, easy layer interruption. | Requires frame/manifest discipline. | **Adopt for MVP.** |
| SVG rectangles | Scales sharply but turns pixel art into verbose vector paths. | No quality gain for this raster source; authoring is worse. | Reject for current art. |
| Rive | Rich state machines and React runtime are available. | Adds a separate runtime and authoring path before the pixel system is proven. | Defer; revisit only if motion complexity exceeds layered frames. |
| Lottie | Good for exported vector timelines. | Poor fit for source-truth pixel rasters and semantic runtime control. | Reject for MVP. |
| Canvas/WebGL | Flexible for larger simulations. | More custom rendering, hit testing, accessibility, and power work. | Defer. |

Rive documents a React runtime and state-machine playback, but its own asset-loading guidance notes embedded assets can increase file size. That reinforces deferring it until a concrete need exceeds the manifest system. See [Rive React](https://rive.app/docs/runtimes/react/react) and [asset loading](https://rive.app/docs/runtimes/react/loading-assets).

## Recommendation

Use 100×100 transparent PNG frames/layers rendered at integer CSS scales with `image-rendering: pixelated`. A typed manifest maps semantic states to layers and sequences; the headless runtime chooses semantic state, never file names. Current proof: layered loaf body/tail/breathe, idle/thinking/success/error frames, directional eye frames, and a manifest-driven renderer.

This removes the legacy `Mascot.tsx` coupling where `hop` and `flip` both attempt to own `transform` on the same image. Placement belongs to the future lifecycle controller, while local visual layers remain independently composable. The current 1.3 MB decorative raster is not the canonical actor path; the validated Sa-Sa pack is 5,010 bytes before bundler compression.

## Validation before format commitment

Prove: a layered interruption, a directional state, static fallback after image failure, reduced motion, lazy behavior-pack loading, and no transform conflict between motion/placement. Do not migrate to another format unless these tests show a concrete limitation.
