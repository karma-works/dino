# ADR-002: Target Audience Priority — Type A First, Type C Second

**Status:** Accepted  
**Date:** 2026-05-14  
**Deciders:** Christian Haegele

---

## Context

"Visually impaired" covers a wide spectrum. Three distinct user types were identified during design discussions, each with different primary tools and different technical requirements:

**Type A — Browser zoom users**  
Low vision, some functional sight. Primary tool: browser zoom (Ctrl+Plus, pinch-to-zoom). Examples: macular degeneration (early/mid stage), aging eyes, mild myopia. Estimated to be the largest segment of visually impaired gamers. Their primary need is that zoom is not blocked.

**Type B — OS-level magnification users**  
Use dedicated screen magnification software (ZoomText, Windows Magnifier, macOS Zoom) that operates at the OS level, magnifying a portion of the entire screen. These users see a zoomed "window" onto the screen and pan around. The game's canvas rendering is largely fine for them already — they're zooming the OS output, not the browser layout.

**Type C — Low vision + screen reader combo**  
Use both zoom and a screen reader (NVDA, JAWS, VoiceOver). Screen readers are not their only interface — they use them for content that's too small or unclear even when zoomed, and for navigation. For DINO, the critical failure for this group is that all menus are canvas-drawn and therefore invisible to screen readers.

A fourth group — **totally blind users who have never seen the game** — was considered and explicitly deprioritized. For this group, the game would need fundamentally different mechanics (echolocation, audio-first levels, slower pacing), amounting to a different game. That work is explicitly out of scope. See `adr-001-single-repo.md`.

## Decision

Implement accessibility in this order:
1. **Type A first** — remove zoom-blocking code
2. **Type C second** — HTML overlays for menus, ARIA live regions
3. **Type B** is largely served by completing Types A and C, with no additional targeted work needed

## Rationale

**Why Type A first:**  
The Type A fix is a single meta tag change and one CSS adjustment. It unblocks the largest visually impaired audience immediately. Shipping this in hours, not weeks, demonstrates commitment and invites early community feedback. The cost of not doing this is turning away users the moment they try to zoom — before they even see the game.

**Why Type C second:**  
Type C users are active gamers. Screen reader users navigate the web daily and have strong opinions about what works and what doesn't. Moving menus to semantic HTML produces a UI that is testable with real tools (NVDA, VoiceOver), gives the project credibility in the accessibility community, and unblocks the Type C audience who are otherwise completely excluded from menu navigation.

**Why Type B third:**  
OS magnification users zoom the rendered output of the browser. The canvas already renders at a fixed internal resolution and scales via CSS — this is consistent with how OS magnifiers work. They benefit from high-contrast mode (Phase 3) and from the zoom-not-blocked changes (Phase 1), but they don't require a targeted initiative beyond that.

## Consequences

**Positive:**
- Phase 1 ships fast, creates momentum, invites community feedback early
- Phase 2 is the hardest work but has the clearest WCAG compliance story
- Phase 3 (contrast, reduced motion, high-contrast mode) benefits all three types simultaneously

**Negative:**
- Type B users with very high magnification levels (8x+) may experience navigation difficulty if levels require rapid lateral movement — the zoomed view clips most of the screen. This is a known limitation and is not addressed by this plan.

## Revisit Condition

If community feedback reveals that Type B is significantly underserved and that OS-magnification users have needs beyond what Phases 1–3 deliver, this prioritization should be revisited.
