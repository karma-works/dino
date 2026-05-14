# ADR-003: Rebuild All Game Menus as Semantic HTML Overlays

**Status:** Accepted  
**Date:** 2026-05-14  
**Deciders:** Christian Haegele

---

## Context

All game UI — main menu, shop, pause screen, game over screen, HUD — is currently drawn directly onto the HTML5 canvas. From the accessibility tree's perspective, the entire game is a single element: an unlabeled canvas. Screen readers read nothing. Keyboard focus cannot reach anything. ARIA has no surface to attach to.

Two approaches were considered to fix this:

**Option A: Canvas accessibility (rejected)**  
Use the canvas `fallback content` slot, canvas ARIA roles, or a mirrored DOM structure (e.g., `aria-owns` pointing to off-screen elements). The ARIA in HTML spec has an `accessibility object model` proposal for canvas, but browser support is experimental and inconsistent. This approach is fragile, non-standard, and would require maintaining a parallel shadow DOM structure that could drift from the canvas rendering.

**Option B: HTML overlays (accepted)**  
Keep the canvas for gameplay visual rendering. Build all interactive UI states (menus, shop, pause, game over) as genuine HTML elements, positioned absolutely over the canvas via CSS. The canvas receives `aria-hidden="true"`. The HTML overlays are the single source of truth for the accessibility tree.

## Decision

All game menus are rebuilt as semantic HTML overlaid on the canvas. The canvas is marked `aria-hidden="true"` and treated as a decorative surface. HTML overlays are the authoritative accessible UI.

The HUD (HP, treasure count, depth, upgrades) remains canvas-drawn during gameplay, supplemented by ARIA live region announcements for state changes (see implementation plan Phase 2a). A full HTML HUD is not in scope for this iteration but is a valid future extension.

## Architecture

```
z-index stack (low → high):
  [canvas]           aria-hidden, gameplay visuals
  [overlay-menu]     role="dialog", shown during MENU state
  [overlay-shop]     role="dialog", shown during SHOP state
  [overlay-pause]    role="dialog", shown during PAUSED state
  [overlay-gameover] role="dialog", shown during GAME_OVER state
  [sr-assertive]     aria-live="assertive", always in DOM, sr-only class
  [sr-polite]        aria-live="polite", always in DOM, sr-only class
```

Overlays use `display: none` / `display: block` toggling (not `visibility: hidden` or `opacity: 0`, which can confuse screen readers). The game state machine in `Game.ts` drives overlay visibility through a `FocusManager` helper.

Focus is trapped inside active overlays using a standard focus-trap pattern (Tab cycles within the overlay, Shift+Tab reverses). On overlay close, focus returns to `#game-wrapper`.

## Rationale

**Why `role="dialog"` with `aria-modal="true"` for each overlay:**  
Game states are mutually exclusive modal contexts. The player cannot interact with the game while the shop is open. `role="dialog"` correctly communicates this to screen readers and triggers appropriate behavior (VoiceOver reads the dialog label on open, NVDA enters "browse mode" for the dialog).

**Why keep the canvas for gameplay:**  
Rebuilding gameplay in HTML (as a grid of focusable cells, for example) would require a complete game re-architecture and is incompatible with real-time physics and rendering. The canvas-for-gameplay compromise is the accepted pattern for accessible canvas games and is explicitly acknowledged in WCAG guidance.

**Why not use `<details>` / `<summary>` or other patterns for menus:**  
Those patterns imply toggleable disclosure widgets. Game menus are modal state transitions, not disclosure. `role="dialog"` is the semantically correct choice.

## Consequences

**Positive:**
- Screen readers (NVDA, VoiceOver, JAWS, TalkBack) can read and navigate all menus
- Keyboard navigation for menus is standard HTML behavior — no custom event handling needed beyond focus management
- HTML menus can be styled independently and serve as the canonical UI reference
- The overlay architecture decouples menu presentation from canvas rendering — future menu redesigns don't require canvas changes

**Negative:**
- Two rendering systems exist for UI: canvas (HUD, gameplay) and HTML (menus). These must be kept visually consistent.
- The canvas still renders menu backgrounds (e.g., the animated starfield behind the main menu) for visual users. The HTML overlay floats above it. This means visual menu styling is partially duplicated.
- Shop state synchronization: the HTML shop overlay must stay in sync with game state (treasure count, upgrade states). This requires explicit wiring between `Game.ts` and the DOM — more coupling than the current canvas-only approach.
