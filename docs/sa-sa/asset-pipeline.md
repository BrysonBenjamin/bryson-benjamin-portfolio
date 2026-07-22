# Sa-Sa asset pipeline

## Locations and naming

- Canonical source: user-provided `sasa.pixil` (100×100, preserve externally until licensing/source ownership is archived).
- Generated web assets: `apps/web/src/assets/sa-sa/`.
- Manifest: `apps/web/src/components/brand/saSaAssets.ts`.
- Semantic IDs: `idle`, `thinking`, `success`, `error`, and `loafing`; never expose these file names to a model or page scene.

File pattern: `sa-sa-{semantic-state}[-{layer-or-direction}].png`. All actor layers are transparent 100×100 PNGs. Use integer display scales and preserve the source palette; do not anti-alias or convert art to SVG rectangles.

## Export recipe

1. Start from the traced 100×100 source and preserve the exact head/body palette.
2. Export a transparent PNG layer or complete frame with the naming pattern above.
3. Add a manifest layer or sequence entry with a semantic ID, duration, and fallback state.
4. Run manifest validation, TypeScript compilation, and production build.
5. Verify an image-load failure resolves to idle and reduced motion resolves to static/minimal movement.

## Current reference pack

| Semantic state | Assets |
| --- | --- |
| Idle/attention | idle, blink, look-left, look-right, base mouth |
| Thinking | thinking frame, open mouth |
| Success | closed-eye success frame |
| Error/offline | error frame, flipped-T mouth |
| Loaf/ambient | tail-free loaf body, breathe overlay, mid/up/down tail layers |
| Static fallback | idle frame |

Walk/arrive, speaking, direct-interaction, and compact-header variants remain required before this pipeline issue can close.

## Loading and fallback

The manifest is the renderer boundary. Static idle loads as the stable fallback; future behavior packs should be dynamically imported rather than eagerly bundled. An image failure switches the renderer to its idle descriptor. Build validation must eventually check filename rules, 100×100 dimensions, duplicate layer IDs, sequence length, fallback presence, and byte budgets.
