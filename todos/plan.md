# DINO — Implementation Plan

## Concept
A dark, oppressive side-scrolling platformer. The dino descends endlessly into a cave.
Target audience: 15+. Art style: pixel silhouettes, Limbo-inspired.
Tech: Bun + TypeScript, HTML5 Canvas, Web Audio API.

---

## Tech Stack
- **Runtime / Bundler**: Bun
- **Language**: TypeScript (strict)
- **Rendering**: HTML5 Canvas 2D
- **Audio**: Web Audio API (procedural sound generation — no asset files)
- **Persistence**: localStorage (high score, deepest level)
- **Server**: Bun HTTP server (dev mode)

---

## Project Structure
```
dino/
├── todos/
│   └── plan.md
├── public/
│   └── index.html          # HTML shell, loads bundle.js
├── src/
│   ├── main.ts             # Entry point: init canvas, boot Game
│   ├── constants.ts        # All magic numbers in one place
│   ├── types.ts            # Shared interfaces & enums
│   ├── Vector2.ts          # 2D vector math utility
│   ├── Input.ts            # Keyboard input manager
│   ├── Audio.ts            # Web Audio API: ambient + SFX
│   ├── Camera.ts           # Follows dino, smoothed
│   ├── Level.ts            # Level data + procedural generation
│   ├── Game.ts             # Game loop, state machine, orchestration
│   ├── Renderer.ts         # All canvas draw calls
│   ├── UI.ts               # HUD, menus, shop overlay
│   └── entities/
│       ├── Entity.ts       # Base class: pos, vel, size, update, draw
│       ├── Dino.ts         # Player: move, jump, fire, upgrades
│       ├── Companion.ts    # AI human: follows dino, can die
│       ├── FireBall.ts     # Dino's projectile
│       ├── Debris.ts       # Falling cave ceiling debris
│       ├── Treasure.ts     # Collectible gem/artifact
│       ├── Merchant.ts     # Shop NPC (stationary, in-level)
│       ├── Enemy.ts        # Basic cave enemy (bat, spider, crawler)
│       └── Boss.ts         # Boss entity (appears every 5 levels)
├── package.json
├── tsconfig.json
└── server.ts               # Bun dev server
```

---

## Phase 1 — Project Scaffold
- [x] `package.json` with bun scripts: `dev`, `build`
- [x] `tsconfig.json` strict TypeScript config
- [x] `public/index.html` canvas shell
- [x] `server.ts` Bun HTTP server with live bundling
- [x] `src/constants.ts`
- [x] `src/types.ts`
- [x] `src/Vector2.ts`

## Phase 2 — Core Engine
- [x] `src/Input.ts` — keyboard state (arrows, WASD, space, F, E)
- [x] `src/Camera.ts` — follows player with lerp smoothing
- [x] `src/Game.ts` — game loop (requestAnimationFrame), state machine
- [x] `src/Audio.ts` — Web Audio context, ambient cave drone, SFX generators

## Phase 3 — Level Generation
- [x] `src/Level.ts`
  - Procedural platform layout (AABB rects)
  - Cave ceiling + floor (solid walls)
  - Stalactites and stalagmites (decorative + collision)
  - Debris spawner positions on ceiling
  - Treasure spawn positions on platforms
  - Merchant spawn (mid-level)
  - Exit shaft (far right, drops to next level)
  - Checkpoint positions (2–3 per level)
  - Difficulty scales with level number

## Phase 4 — Entities
- [x] `src/entities/Entity.ts` — base class
- [x] `src/entities/Dino.ts`
  - Left/right movement, jump (double jump unlockable)
  - Fire projectile (left/right facing)
  - Health system (hearts, upgradeable)
  - Shield mechanic (bought from merchant)
  - Upgrade state: speed, fire rate, fire damage, health
  - Death + respawn at checkpoint
- [x] `src/entities/Companion.ts`
  - Follows dino X position with easing
  - Jumps gaps automatically (simple pathfinding)
  - Dies on contact with debris/enemies
  - Stays dead until revived at merchant
- [x] `src/entities/FireBall.ts`
  - Travels horizontally at speed
  - Destroys on wall/enemy contact
  - Particle trail
- [x] `src/entities/Debris.ts`
  - Warning crack animation on ceiling
  - Falls vertically after delay
  - Shatters on ground
  - Instant kill (or chip damage with shield)
- [x] `src/entities/Treasure.ts`
  - Glow pulse animation
  - Auto-collect on overlap
  - Different types: gem (1), artifact (3), skull (5)
- [x] `src/entities/Merchant.ts`
  - Stationary NPC
  - Press E near them to open shop
  - Sells: Shield, Fire+, Speed+, Double Jump, Companion Revive, Extra Heart
- [x] `src/entities/Enemy.ts`
  - Types: Bat (flies, swoops), Spider (drops from ceiling), Crawler (walks platform)
  - All damage dino/companion on contact
  - Die to fire projectiles
  - Drop small treasure chance
- [x] `src/entities/Boss.ts`
  - Appears at levels 5, 10, 15, 20...
  - Phase 1: patrol + debris summon
  - Phase 2 (50% HP): faster, more debris, charges
  - Large silhouette with glowing red eyes
  - Drops major treasure on death

## Phase 5 — Renderer
- [x] `src/Renderer.ts`
  - Dark background gradient (deeper = darker blue-black)
  - Cave wall silhouettes (jagged polygon edges)
  - Platform rendering with rough top edges
  - Stalactites/stalagmites
  - Glowing crystals (ambient light dots)
  - Parallax background layers (3 layers)
  - Particle system (fire trail, debris shatter, treasure sparkle)
  - Fog/vignette overlay

## Phase 6 — UI
- [x] `src/UI.ts`
  - HUD: heart icons, treasure counter, level number, depth meter
  - Companion status indicator (alive/dead)
  - Shield indicator (active/duration bar)
  - Fire level indicator
  - Shop overlay (when near merchant + E pressed)
  - Main menu screen
  - Game over screen (score, deepest level, restart)
  - Level transition screen (brief "DEPTH: X meters" flash)
  - Checkpoint flash effect

## Phase 7 — Audio
- [x] `src/Audio.ts`
  - Ambient: low cave drone (oscillator, filtered noise)
  - SFX: jump, fire, hit, death, treasure, shop buy, door/exit
  - Boss music: intensified ambient layer
  - Companion scream (on death)
  - Cave drip sounds (random interval)
  - Debris rumble (before fall)

## Phase 8 — Persistence
- [x] Save/load high score and deepest level to localStorage
- [x] Settings: mute toggle

---

## Game Constants
| Constant | Value |
|---|---|
| Canvas | 800 × 500 |
| Tile size | 32px |
| Gravity | 0.5 px/frame² |
| Dino base speed | 4 px/frame |
| Jump force | -13 px/frame |
| Fire speed | 8 px/frame |
| Level width | 6000px |
| Debris warning time | 1.5s |
| Boss levels | 5, 10, 15, 20... |

---

## Progressive Difficulty Curve
| Level | Changes |
|---|---|
| 1–3 | Slow debris, few enemies, wide platforms |
| 4–5 | More debris, bats added, narrower gaps |
| 5 | BOSS 1 |
| 6–9 | Spiders + crawlers, debris faster, darker bg |
| 10 | BOSS 2 (harder phase 2) |
| 11+ | Multiple debris per zone, enemy swarms |
| 15+ | Fast debris, minimal warning time |
| 20+ | Near-instant debris, elite enemies |

---

## Shop Items & Costs
| Item | Cost | Effect |
|---|---|---|
| Shield | 5 | Block one hit; shown as aura |
| Fire+ | 8 | +1 fire damage, faster fire rate |
| Speed+ | 6 | +20% movement speed |
| Double Jump | 10 | Unlock second jump |
| Extra Heart | 12 | +1 max HP |
| Revive Companion | 7 | Bring human back to life |

---

## Controls
| Key | Action |
|---|---|
| A / ← | Move left |
| D / → | Move right |
| W / ↑ / Space | Jump |
| F / Z | Spit fire |
| E | Interact (merchant) |
| M | Mute audio |
| Escape | Pause |
