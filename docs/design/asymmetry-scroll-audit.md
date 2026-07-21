# Asymmetry and scroll audit

Linear: BRY-25

## Working direction

Use the existing design system as a crafted product surface with editorial asymmetry.
The page should lead with product-builder clarity, then use layout, widgets, and small
brand details to show creative taste.

## Current read

The BRY-23 pass established the right materials: warm themes, mascot, tokens,
cards, selected work, writing, about, and the public build feed. The page still
reads too evenly in places because most sections use balanced grids with equal
card weights.

## Top layout changes

1. Replace equal section grids with reusable asymmetrical primitives.
   The hero, work, feed, and about sections should use offset columns or staggered
   surfaces rather than symmetric two- or three-column blocks.

2. Make selected work hierarchical.
   One featured project should take more space, with supporting cards offset
   around it. This makes the section read as curated proof instead of a generic
   card row.

3. Treat the build log as the operating-surface proof.
   The feed should sit beside sticky explanatory copy so the widget feels like
   part of the portfolio argument, not an unrelated status panel.

## Top scroll changes

1. Use section-scoped sticky narrative copy.
   The build-log section is the best first target. Sticky copy can explain why
   the live surface matters while the feed remains the active object.

2. Add reveal rhythm later, not as a dependency.
   Subtle 4-8px translate/fade reveals can help section rhythm, but all content
   must be visible and understandable without motion or JavaScript.

## Mobile risks

- Offset and staggered desktop layouts must collapse to a single reading path.
- Sticky behavior should turn off on small screens.
- The mascot and speech bubble must not push hero CTAs below a reasonable first
  viewport.
- Long labels inside cards need wrapping rules and stable dimensions.

## BRY-26 baseline

Create CSS-first primitives for:

- `AsymmetricSection`: offset two-column composition.
- `StickyNarrative`: sticky copy plus active surface.
- `StaggeredGrid`: featured card plus offset supporting cards.

These primitives should be used immediately by the homepage so the next
recomposition task can build on real structure.
