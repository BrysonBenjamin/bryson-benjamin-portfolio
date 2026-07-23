# Sa-Sa guardrails and budgets

## Accessibility and control

- One canonical actor has one accessible name; decorative marks use `aria-hidden`.
- Chat opens only from an explicit control, manages focus, and restores focus when dismissed.
- `prefers-reduced-motion` resolves to a static or minimal-motion state, not merely faster animation.
- Pause motion and Hide Sa-Sa are visible chat controls. Both persist only as non-sensitive `localStorage` preferences; Hide replaces the actor with a fixed Show Sa-Sa restore control.
- The actor must never trap focus, hijack scroll, cover a registered safe zone, or prevent navigation.
- Agent failure leaves all portfolio content and navigation usable.

## Performance budget

| Budget | MVP limit | Enforcement |
| --- | --- | --- |
| Initial Sa-Sa visual payload | 30 KB compressed | Asset validation/build report |
| Lazy behavior pack | 60 KB compressed each | Dynamic import/build report |
| Ambient main-thread work | One scheduled action at a time; no layout polling loop | Runtime policy/test |
| Hidden/offscreen activity | No animation timer or sensor work | Lifecycle controller/test |
| Static fallback | One 100×100 asset | Renderer error handling/test |

The old 1.3 MB source is retained only as the legacy decorative baseline, not as the canonical actor's eager payload.

## Lifecycle policy

Visible, active, motion-allowed actor: ambient behavior may run. Hidden tab, paused/dismissed actor, or a higher-priority behavior: ambient work suspends. A resumed actor returns to a stable idle state before scheduling new ambient behavior. Geometry updates are `ResizeObserver`/scroll driven and batched in one animation frame.

## Placement policy

Pages register anchors, exclusion/safe zones, and responsive availability. The placement controller rejects positions that overlap controls, task overlays, reading flow, or unavailable mobile regions. It owns transforms; visual layers do not.

## Agent failure policy

The guide has independent `disabled`, `offline`, and `error` states. None can disable links, page actions, existing task overlays, or the local actor controls. A deterministic guide is explicitly labelled as public-portfolio guidance; a real model provider may not be described as active until server credentials, budget caps, and live evaluation are configured.

The semantic allowlist, execution targets, and non-goals are recorded in [capability-contract.md](./capability-contract.md). Provider output is never trusted as a DOM instruction, URL, asset name, or executable command.
