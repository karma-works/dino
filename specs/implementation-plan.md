# Accessibility Implementation Plan

**Project:** DINO — Descend Into Darkness  
**Scope:** Accessibility for low-vision users  
**Status:** Approved — implementation pending  
**Last updated:** 2026-05-14

---

## Context

DINO is a real-time canvas platformer with a dark, atmospheric tone. Following a design interview (see ADRs), the team decided to invest in genuine accessibility for **visually impaired players who retain some functional vision** — specifically those who rely on browser zoom, high-contrast modes, and screen readers as a supplement to vision rather than a replacement for it.

The game's theme — *Descend Into Darkness* — is treated as an asset, not a liability. The audio and atmospheric design should feel like a **thriller**, not a concession to accessibility. Every change should either improve the experience for all players or be invisible to those who don't need it.

---

## Guiding Principles

1. **Don't break the game for sighted players.** Accessibility is additive. The canvas stays. The gameplay stays.
2. **The canvas is decoration. HTML is the truth.** All interactive UI moves to semantic HTML overlaid on the canvas. `aria-hidden="true"` on the canvas itself.
3. **Audio is a first-class sense.** The thriller atmosphere is strengthened, not compromised, by better audio design. Spatial cues serve both immersion and accessibility.
4. **Zoom must simply work.** Browser zoom is the primary tool of Type A users. Any code that blocks it is a P0 bug.
5. **Invite feedback publicly.** The README explicitly asks visually impaired players to report their experience. There are no test cases — only collaborators.

---

## Target Audiences (in priority order)

| Type | User | Primary tool | Audience size | Priority |
|------|------|-------------|---------------|----------|
| A | Low vision, some functional sight | Browser zoom (Ctrl+Plus, pinch) | Very large | **First** |
| C | Low vision + screen reader combo | Zoom + NVDA / VoiceOver / JAWS | Large | **Second** |
| B | OS-level magnification (ZoomText) | Full-screen magnifier | Medium | Third (largely free after A+C) |

See `adr-002-target-audience.md` for the full decision rationale.

---

## Phase 1 — Browser Zoom (Type A) · Quick Wins

**Goal:** A Type A user can zoom to 200–400% without the browser blocking them, and the game remains playable.

**Effort:** 1–2 hours  
**WCAG criteria addressed:** 1.4.4 (Resize Text, AA), 1.4.10 (Reflow, AA)

### Tasks

- [ ] **Remove `user-scalable=no`** from the viewport meta tag in `public/index.html`
  - Current: `<meta name="viewport" content="..., maximum-scale=1.0, user-scalable=no" />`
  - Target: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
  - This is the single most important change in Phase 1. It is a P0 WCAG failure today.

- [ ] **Remove `touch-action: none` from `body`** in `public/index.html`
  - Keep `touch-action: none` on `#canvas` specifically (needed for touch game controls)
  - Removing it from `body` re-enables pinch-to-zoom on mobile and tablet

- [ ] **Add `tabindex="0"` to a `#game-wrapper` div** wrapping the canvas
  - Allows keyboard focus to land on the game region without needing a mouse click first
  - Required for keyboard-only players to start interacting immediately

- [ ] **Test zoom behavior at 150%, 200%, 300%, 400%**
  - Canvas CSS scales with zoom (pixels get bigger — correct for a pixel-art game)
  - Verify no horizontal scroll is forced at 200%
  - Note: canvas *content* does not reflow — this is acceptable for a game application under WCAG's "full page reflow" exception for applications

### Acceptance Criteria
- Browser zoom from 100% to 400% is not blocked by any meta tag or CSS property
- Pinch-to-zoom on touch devices reaches at least 200%
- The game remains playable (controls still work) at 200% zoom
- No horizontal scrollbar appears at 200%

---

## Phase 2 — Screen Reader Support (Type C) · HTML Overlay Architecture

**Goal:** All game menus are readable and navigable by a screen reader. Game events (damage, checkpoint, death, level transition) are announced via ARIA live regions. The canvas is treated as a purely decorative surface.

**Effort:** 3–5 days  
**WCAG criteria addressed:** 1.3.1 (Info and Relationships, A), 2.1.1 (Keyboard, A), 2.4.3 (Focus Order, A), 4.1.2 (Name, Role, Value, A), 4.1.3 (Status Messages, AA)

### Architecture

```
public/index.html
├── <div id="sr-assertive" aria-live="assertive" aria-atomic="true" class="sr-only">
│     Critical events: damage taken, death, checkpoint reached
├── <div id="sr-polite" aria-live="polite" aria-atomic="false" class="sr-only">
│     Informational: treasure collected, level complete, upgrade bought
├── <div id="game-wrapper" role="application" aria-label="DINO — Descend Into Darkness" tabindex="0">
│   └── <canvas id="canvas" aria-hidden="true">
├── <div id="overlay-menu" role="dialog" aria-label="Main Menu" aria-modal="true"> [shown/hidden]
├── <div id="overlay-shop" role="dialog" aria-label="The Merchant" aria-modal="true"> [shown/hidden]
├── <div id="overlay-pause" role="dialog" aria-label="Game Paused" aria-modal="true"> [shown/hidden]
└── <div id="overlay-gameover" role="dialog" aria-label="Game Over" aria-modal="true"> [shown/hidden]
```

The canvas continues to render the game visually. HTML overlays are layered on top via `position: absolute`. When an overlay is active, focus is trapped inside it. When dismissed, focus returns to `#game-wrapper`.

### Tasks

#### 2a — ARIA Live Region Wiring

- [ ] Add `#sr-assertive` and `#sr-polite` divs to `index.html` with `.sr-only` CSS class
- [ ] Create `src/Announcer.ts` — a thin wrapper that writes to both live regions and optionally triggers Web Speech TTS
  ```typescript
  export class Announcer {
    assertive(message: string): void  // damage taken, death
    polite(message: string): void     // treasure, checkpoint, shop events
    speak(message: string): void      // Web Speech TTS (menus, shop descriptions)
  }
  ```
- [ ] Wire Announcer into `Game.ts` for these events:
  - Damage taken: `"Hit! ${hp} hearts remaining"`
  - Death: `"You died. Reached depth ${levelNum}. Score: ${score}."`
  - Checkpoint: `"Checkpoint reached"`
  - Treasure collected: `"${value} gems collected. Total: ${total}"`
  - Level complete: `"Descending to depth ${next}"`
  - Boss appeared: `"Warning — something massive stirs ahead"`
  - Companion died: `"Your companion has fallen"`
  - Companion revived: `"Your companion lives again"`

#### 2b — Main Menu HTML Overlay

- [ ] Build `#overlay-menu` in `index.html`
  - `<h1>DINO</h1>` with tagline
  - `<p>` with high score / depth record
  - `<button id="btn-start">Begin Descent</button>` — triggers game start
  - Controls listed as `<dl>` definition list
  - Focus lands on `#btn-start` when overlay opens
  - Canvas continues animating behind it (decorative background)

#### 2c — Shop HTML Overlay

- [ ] Build `#overlay-shop` in `index.html`
  - `<h2>The Merchant</h2>`
  - `<p>Treasures: <span id="shop-balance">0</span></p>`
  - `<ul role="listbox" aria-label="Shop items" id="shop-list">`
    - Each item: `<li role="option" aria-selected aria-disabled tabindex="0">`
    - Item contains: name, description, cost, ownership status
  - Arrow keys navigate, Enter/Space buys, E/Escape closes
  - When item receives focus, Web Speech TTS reads: name + description + cost
  - Screen reader also reads this naturally via aria-label

#### 2d — Pause and Game Over HTML Overlays

- [ ] `#overlay-pause`: heading "Paused", two buttons (Resume, Mute toggle)
- [ ] `#overlay-gameover`: heading "You Died", stats paragraph, restart button
- [ ] Both trap focus while active, return focus to `#game-wrapper` on dismiss

#### 2e — Focus Management

- [ ] `src/FocusManager.ts` — handles transitions between game states
  - On enter `MENU` state → show `#overlay-menu`, focus `#btn-start`
  - On enter `SHOP` state → show `#overlay-shop`, focus first shop item
  - On enter `PAUSED` state → show `#overlay-pause`, focus resume button
  - On enter `GAME_OVER` state → show `#overlay-gameover`, focus restart button
  - On enter `PLAYING` state → hide all overlays, focus `#game-wrapper`
  - Focus trap: `Tab` cycles within active overlay only

#### 2f — Web Speech TTS

- [ ] Add `speak()` to Announcer using `window.speechSynthesis`
  - Cancel current utterance before speaking (prevents queue buildup)
  - Respect user mute state (`this.audio.isMuted`)
  - Pitch and rate variations for urgency: normal events use rate 1.0, danger events use rate 1.15 and pitch 0.9
  - Only fires for menu/shop contexts — not during gameplay (see `adr-005-no-voice-gameplay.md`)

### Acceptance Criteria
- VoiceOver (macOS) and NVDA (Windows) read main menu, shop, pause, game over correctly
- All game events listed in 2a are announced during play without disrupting game loop
- No orphaned focus (focus never lands on a non-interactive element or disappears)
- Shop is fully navigable keyboard-only, including purchase and exit

---

## Phase 3 — Visual Accessibility Polish

**Goal:** The game's visual design works for users with common low-vision conditions: macular degeneration, glaucoma, color deficiencies.

**Effort:** 2–3 days  
**WCAG criteria addressed:** 1.4.1 (Use of Color, A), 1.4.3 (Contrast Minimum, AA), 1.4.6 (Contrast Enhanced, AAA), 1.4.11 (Non-text Contrast, AA), 2.3.1 (Three Flashes, A)

### Tasks

#### 3a — Contrast Audit

Current known failures in `constants.ts`:

| Color token | Value | Background | Ratio | WCAG AA (4.5:1) | WCAG AAA (7:1) |
|-------------|-------|------------|-------|-----------------|----------------|
| `textDim` | `#666688` | `#030308` | ~3.7:1 | **FAIL** | FAIL |
| `textMain` | `#dddddd` | `#030308` | ~15:1 | Pass | Pass |
| `hpColor` | `#cc2200` | `#030308` | ~4.2:1 | **FAIL** | FAIL |

- [ ] Raise `textDim` to at least `#8888aa` (targets ~5.5:1 for AA, adjust for AAA)
- [ ] Audit all other color pairs in HUD and menu rendering
- [ ] Add contrast ratio comments next to each color in `constants.ts` for future maintainability

#### 3b — High-Contrast Mode

- [ ] Add `highContrast: boolean` to a persistent `AccessibilitySettings` object (localStorage)
- [ ] Add toggle to pause menu HTML overlay ("High Contrast: On/Off")
- [ ] When active, override canvas colors with high-contrast palette:
  - Backgrounds: pure black `#000000`
  - Text: pure white `#ffffff`
  - Danger (debris, enemies): bright yellow `#ffff00`
  - Friendly (player, companion): bright cyan `#00ffff`
  - Treasure: bright green `#00ff00`
  - Exit: bright blue `#4488ff`
- [ ] CSS `prefers-contrast: more` media query auto-enables this mode on first load

#### 3c — Reduced Motion

- [ ] Detect `prefers-reduced-motion: reduce` on load, persist as `reducedMotion` setting
- [ ] Toggle in pause menu
- [ ] When active:
  - Disable camera shake (set `Camera.shakeAmount = 0`)
  - Disable damage flash overlay
  - Disable level-transition fade animation
  - Keep all gameplay animations (they convey game state)

#### 3d — Larger HUD Text Option

- [ ] Add `largeHUD: boolean` to `AccessibilitySettings`
- [ ] When active, increase HUD font sizes by 50% (11px → 16px, 14px → 21px)
- [ ] Toggle in pause menu

### Acceptance Criteria
- `textDim` passes WCAG AA (4.5:1) against all backgrounds it appears on
- High-contrast mode produces no WCAG contrast failures at Level AA
- Reduced motion mode eliminates all WCAG 2.3.1 potential flash triggers
- `prefers-contrast` and `prefers-reduced-motion` are respected on first load without user action

---

## Phase 4 — Testing & Community Feedback

**Goal:** The implementation is validated with real assistive technology and visually impaired players are actively invited to improve it.

**Effort:** Ongoing

### Tasks

- [ ] **Manual test matrix**

  | Tool | OS | Browser | Phase 1 | Phase 2 | Phase 3 |
  |------|----|---------|---------|---------|---------|
  | VoiceOver | macOS | Safari | | | |
  | VoiceOver | iOS | Safari | | | |
  | NVDA | Windows | Firefox | | | |
  | JAWS | Windows | Chrome | | | |
  | TalkBack | Android | Chrome | | | |

- [ ] Create GitHub Issue label: `accessibility`
- [ ] Create GitHub Issue template: `.github/ISSUE_TEMPLATE/accessibility-feedback.yml`
- [ ] Add `TESTING.md` to repo root — 15-minute structured test protocol for community testers
- [ ] Add `ACCESSIBILITY.md` to repo root — detailed statement of what's supported and what's known to be broken
- [ ] See `adr-006-testing-strategy.md` for the full automated testing architecture

---

## Non-Goals

The following are explicitly out of scope for this plan:

- **Making real-time gameplay navigable by totally blind users.** The game remains a visual platformer. Audio cues supplement vision; they don't replace it.
- **Voice commands during gameplay.** Latency and accuracy are incompatible with real-time controls. See `adr-005-no-voice-gameplay.md`.
- **A separate forked repo.** Changes ship in the main `dino` repository. See `adr-001-single-repo.md`.
- **Compliance theater.** No overlay widgets, no automated accessibility plugins that paper over real failures. Real HTML, real semantics, real testing.

---

## Success Metric

A low-vision player using browser zoom at 250% can:
1. Read the main menu without a screen reader
2. Navigate the shop using arrow keys
3. Understand their HP, treasure count, and current depth during play
4. Know immediately when they've been hit, reached a checkpoint, or died

That's the bar. Not a WCAG audit score — a real person playing the game.
