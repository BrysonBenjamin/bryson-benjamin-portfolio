# Sa-Sa product contract

**Owner:** Bryson Benjamin  
**Decision date:** 2026-07-22  
**Status:** MVP contract

## Promise

Sa-Sa is the portfolio's optional guide. He adds context and delight, but a visitor can browse every page, project, and contact path without seeing, opening, or depending on him.

## Actor model

There is one canonical Sa-Sa actor. It owns interactive identity, local visual state, chat state, and placement. Decorative `Mascot` marks remain static, `aria-hidden`, and never become additional chat entry points.

## MVP journeys

| Journey | Expected behavior | No-model boundary |
| --- | --- | --- |
| First visit | A non-blocking static/idle Sa-Sa is discoverable near a registered page anchor. | Ambient blink, glance, loaf, and tail motion are local only. |
| Direct interaction | A deliberate activation opens the conversation surface and places focus in the composer. | Hover, focus, and tap may trigger a local reaction but never an LLM request. |
| Portfolio question | The visitor submits text and sees thinking, streaming, sources, retry, and stop states. | The request starts only after submit. |
| Page action | Sa-Sa describes a proposed local action and runs only a registered, reversible action. | No arbitrary URL, DOM, or code action is available. |
| Dismiss/pause | The actor stops motion and chat can be closed; navigation stays unchanged. | Preference is local and non-sensitive. |
| Reduced motion/mobile | A calm static mark or minimal state is used; controls stay reachable. | No automatic locomotion or attention-grabbing loop. |
| Provider failure | The character reports an honest offline state and local navigation remains available. | The site never blocks on the agent. |

## Mode vocabulary

| Mode | Trigger | Capability |
| --- | --- | --- |
| Ambient | Local timer, scene, or visibility policy | Local visual behavior only. |
| Direct | Explicit pointer, keyboard, or touch action | Local response; may open chat. |
| Conversational | Submitted user turn | Stream grounded portfolio answer. |
| Tool acting | Validated tool request during a submitted turn | Execute one allowlisted local page action. |

Passive scene, scroll, pointer, visibility, or timer events **must not** start an agent turn.

## Scope

**MVP:** canonical actor, scene anchors, local ambient/direct reactions, text chat, grounded public answers, source links, one reversible page action, cancellation/clear, reduced motion, dismissal, and honest degradation.

**Post-MVP:** richer behavior packs, more page actions, improved asset authoring, and evaluation depth.

**Stretch:** voice, long-term personalization, drag/pet interactions, sound, and Easter eggs.

## Success and guardrails

Track discovery, explicit chat opens, grounded-answer completion, source-click rate, action completion, first-token latency, cancellation, provider error, dismiss/pause, cumulative layout shift, and asset/runtime cost. A rise in dismissals, repeated cancellations, blocked controls, or performance regressions is a release blocker, not a growth metric.

Open questions use this document as the decision log. The owner is Bryson Benjamin; unresolved decisions block the dependent implementation issue rather than being silently guessed.
