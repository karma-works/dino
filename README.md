<p align="center">
  <strong style="font-size:3em">🦕 DINO</strong>
</p>

<p align="center">
  <strong>A dark, oppressive browser platformer. Descend. Survive.</strong><br/>
  Spit fire · Collect relics · Outrun the falling dark
</p>

<p align="center">
  <a href="https://karma-works.github.io/dino/"><strong>▶ Play Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="todos/plan.md">Design Document</a>
  &nbsp;·&nbsp;
  <a href="specs/implementation-plan.md">Accessibility Plan</a>
  &nbsp;·&nbsp;
  <a href="specs/adr-006-testing-strategy.md">Testing Strategy</a>
  &nbsp;·&nbsp;
  <a href="LICENSE">MIT License</a>
</p>

---

## A note for visually impaired players

If you're playing DINO with a screen magnifier, browser zoom, or a screen reader — we want to hear from you.

This game is actively being made more accessible. Browser zoom should work. High-contrast mode is coming. Screen reader support for all menus is in development. But we're building this with real feedback, not assumptions, and we know we'll get things wrong without you telling us.

**What we'd love to know:**

- What assistive tools do you use? (browser zoom level, screen reader, OS magnification)
- What broke or felt wrong?
- What worked better than you expected?
- What would make this game genuinely enjoyable for you — mechanics, audio, UI, anything?

**[Open an accessibility feedback issue →](https://github.com/karma-works/dino/issues/new?labels=accessibility&title=Accessibility+feedback)**

No template to fill out. Just tell us what happened and what your setup is. You're not a test case — you're shaping what this game becomes.

---

## About

**DINO** is a tense, dark side-scrolling platformer for players 15+.
You descend endlessly into a cave — each level deeper, darker, and more hostile than the last.
There is no safe place. Only survival.

- **Descend** through infinite procedurally generated cave levels
- **Spit fire** to destroy enemies and clear your path
- **Dodge falling debris** that punches through the cave ceiling without warning
- **Fight bosses** that appear every 5 levels, growing stronger with each encounter
- **Trade relics** with a hooded Merchant found somewhere in each level
- **Protect your companion** — a terrified human who follows you and can die

## Controls

| Action | Key |
|---|---|
| Move | `A` / `D` or `←` / `→` |
| Jump | `W` / `↑` / `Space` |
| Spit Fire | `F` / `Z` |
| Talk to Merchant | `E` |
| Pause | `Escape` |
| Mute / Unmute | `M` |

## Shop Items

| Item | Cost | Effect |
|---|---|---|
| Shield | 💎 5 | Block one hit — shown as aura |
| Fire+ | 💎 8 | Stronger fire, faster rate (up to ×3) |
| Speed+ | 💎 6 | +20% movement speed (up to ×3) |
| Double Jump | 💎 10 | Unlock a second jump |
| Extra Heart | 💎 12 | +1 max HP (up to 6) |
| Revive Companion | 💎 7 | Bring your human back to life |

## Difficulty Curve

| Depth | What changes |
|---|---|
| 1–3 | Slow debris, wide platforms, bats only |
| 4–5 | More debris, spiders and crawlers appear |
| **5** | **Boss 1** |
| 6–9 | Enemy swarms, debris faster, cave darker |
| **10** | **Boss 2** (harder phase 2) |
| 11+ | Near-instant debris, elite enemies |
| **15 / 20 / …** | **Boss every 5 levels, scaling with depth** |

## Tech Stack

| | |
|---|---|
| **Runtime / Bundler** | [Bun](https://bun.sh/) |
| **Language** | TypeScript (strict) |
| **Renderer** | HTML5 Canvas 2D |
| **Audio** | Web Audio API (procedural — no asset files) |
| **Persistence** | `localStorage` (high score, deepest level) |

## Getting Started

```bash
# Install Bun (if needed)
curl -fsSL https://bun.sh/install | bash

# Start dev server (http://localhost:3000)
bun run dev

# Typecheck
bun run typecheck

# Production build → public/bundle.js
bun run build
```

## Project Structure

```
dino/
├── public/
│   ├── index.html        HTML shell
│   └── bundle.js         Built output (generated)
├── src/
│   ├── main.ts           Entry point — canvas setup, boots Game
│   ├── constants.ts      All tuning values
│   ├── types.ts          Shared interfaces & enums
│   ├── Vector2.ts        2D math utility
│   ├── Input.ts          Keyboard input manager
│   ├── Audio.ts          Web Audio API — ambient drone + all SFX
│   ├── Camera.ts         Smooth follow camera with screen shake
│   ├── Level.ts          Procedural cave level generator
│   ├── Renderer.ts       Canvas draw calls — bg, parallax, fog, vignette
│   ├── UI.ts             HUD, menus, shop overlay, flashes
│   ├── Game.ts           Game loop, state machine, collision orchestration
│   └── entities/
│       ├── Entity.ts     Base class — physics, AABB collision
│       ├── Dino.ts       Player — movement, fire, upgrades, shield
│       ├── Companion.ts  AI human — follows, can die, ragdoll
│       ├── FireBall.ts   Projectile with particle trail
│       ├── Debris.ts     Falling cave rock with crack warning
│       ├── Treasure.ts   Gem / Artifact / Skull collectibles
│       ├── Merchant.ts   Shop NPC with lantern glow
│       ├── Enemy.ts      Bat / Spider / Crawler
│       └── Boss.ts       2-phase boss with debris summon + charge
├── todos/
│   └── plan.md           Full implementation plan
├── server.ts             Bun dev server (live bundle on request)
├── package.json
└── tsconfig.json
```

## Accessibility

DINO is being made accessible for visually impaired players. See the [implementation plan](specs/implementation-plan.md) for full details.

**Current status:**
- [ ] Browser zoom unblocked (Phase 1 — in progress)
- [ ] Semantic HTML menus with screen reader support (Phase 2)
- [ ] High-contrast mode, reduced motion, larger HUD text (Phase 3)

**Supported assistive technologies (target):**
- Browser zoom up to 400% (Chrome, Firefox, Safari, Edge)
- Screen readers: VoiceOver (macOS/iOS), NVDA (Windows), JAWS (Windows), TalkBack (Android)
- OS-level magnification software

**Known limitations:**
- Real-time gameplay is canvas-rendered and not directly accessible to screen readers. Audio cues and ARIA live region announcements supplement visual gameplay information.
- Totally blind users who have never played a platformer are not the primary target for this iteration. We'd still love to hear from you.

[Open an accessibility issue →](https://github.com/karma-works/dino/issues/new?labels=accessibility&title=Accessibility+feedback)

## License

[MIT](LICENSE) © 2026 karma-works
