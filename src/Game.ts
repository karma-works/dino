import { CANVAS_W, CANVAS_H, SHOP_ITEMS, LEVEL_HEIGHT, COLORS } from "./constants.js";
import { GameState, LevelData } from "./types.js";
import { Input } from "./Input.js";
import { Camera } from "./Camera.js";
import { AudioManager } from "./Audio.js";
import { Renderer } from "./Renderer.js";
import { UI } from "./UI.js";
import { generateLevel, generateStalactites, generateCrystals, StalactiteData, CrystalData } from "./Level.js";
import { Dino } from "./entities/Dino.js";
import { Companion } from "./entities/Companion.js";
import { Debris } from "./entities/Debris.js";
import { Treasure } from "./entities/Treasure.js";
import { Merchant } from "./entities/Merchant.js";
import { Enemy } from "./entities/Enemy.js";
import { Boss } from "./entities/Boss.js";

const SAVE_KEY = "dino_save";
const DEBRIS_SPAWN_INTERVAL_BASE = 3500;
const DRIP_INTERVAL = 8000;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: Input;
  private camera: Camera;
  private audio: AudioManager;
  private renderer: Renderer;
  private ui: UI;

  private state: GameState = GameState.MENU;
  private levelNum = 1;
  private score = 0;
  private treasures = 0;
  private highScore = 0;
  private depthRecord = 0;

  private levelData!: LevelData;
  private stalactites: StalactiteData[] = [];
  private crystals: CrystalData[] = [];

  private dino!: Dino;
  private companion!: Companion;
  private debrisList: Debris[] = [];
  private treasureList: Treasure[] = [];
  private merchant!: Merchant;
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;

  private debrisSpawnTimer = 0;
  private debrisSpawnInterval = DEBRIS_SPAWN_INTERVAL_BASE;
  private shopSelectedIdx = 0;
  private lastTime = 0;
  private dripTimer = 0;
  private audioStarted = false;

  private checkpointX = 120;
  private checkpointY = 0;
  private respawnQueued = false;
  private respawnTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.input = new Input();
    this.camera = new Camera();
    this.audio = new AudioManager();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UI();
    this.loadSave();
  }

  private loadSave(): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.highScore = data.highScore ?? 0;
        this.depthRecord = data.depthRecord ?? 0;
      }
    } catch {}
  }

  private saveSave(): void {
    if (this.score > this.highScore) this.highScore = this.score;
    if (this.levelNum > this.depthRecord) this.depthRecord = this.levelNum;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        highScore: this.highScore,
        depthRecord: this.depthRecord,
      }));
    } catch {}
  }

  getState(): GameState { return this.state; }
  getInput(): Input { return this.input; }
  isMerchantNear(): boolean { return !!this.merchant?.nearPlayer; }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(now: number): void {
    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    this.update(dt);
    this.draw();
    this.input.flush();

    requestAnimationFrame(this.loop.bind(this));
  }

  private initLevel(n: number): void {
    this.levelNum = n;
    this.levelData = generateLevel(n);
    this.stalactites = generateStalactites(n);
    this.crystals = generateCrystals(n);

    const { platforms } = this.levelData;
    const floorY = LEVEL_HEIGHT - 30;

    // Spawn dino at start
    this.dino = new Dino(120, floorY - 60);
    this.companion = new Companion(80, floorY - 50);

    // Set checkpoint
    this.checkpointX = 120;
    this.checkpointY = floorY - 60;

    // Debris
    this.debrisList = [];
    this.debrisSpawnTimer = 0;
    this.debrisSpawnInterval = Math.max(800, DEBRIS_SPAWN_INTERVAL_BASE - n * 100);

    // Treasures
    this.treasureList = this.levelData.treasureSpots.map(
      (t) => new Treasure(t.x, t.y, t.type)
    );

    // Merchant
    this.merchant = new Merchant(
      this.levelData.merchantX,
      this.findFloorY(this.levelData.merchantX, platforms)
    );

    // Enemies
    this.enemies = this.levelData.enemySpots.map(
      (e) => new Enemy(e.x, e.y, e.type)
    );

    // Boss
    if (this.levelData.bossX !== undefined) {
      const by = this.findFloorY(this.levelData.bossX, platforms);
      this.boss = new Boss(this.levelData.bossX, by - 110, n);
    } else {
      this.boss = null;
    }

    this.respawnQueued = false;

    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.follow(this.dino.x, this.dino.y, this.dino.w, this.dino.h);
  }

  private findFloorY(x: number, platforms: ReturnType<typeof generateLevel>["platforms"]): number {
    let best = LEVEL_HEIGHT - 30;
    for (const p of platforms) {
      if (!p.isCeiling && x >= p.x && x <= p.x + p.w) {
        if (p.y < best) best = p.y;
      }
    }
    return best;
  }

  private update(dt: number): void {
    this.ui.update(dt);
    this.renderer.update(dt);

    if (this.input.mute()) this.audio.toggleMute();

    switch (this.state) {
      case GameState.MENU: this.updateMenu(dt); break;
      case GameState.PLAYING: this.updatePlaying(dt); break;
      case GameState.SHOP: this.updateShop(dt); break;
      case GameState.PAUSED: this.updatePaused(dt); break;
      case GameState.GAME_OVER: this.updateGameOver(dt); break;
      case GameState.LEVEL_WIN: this.updateLevelWin(dt); break;
    }
  }

  private updateMenu(_dt: number): void {
    if (this.input.confirm()) {
      if (!this.audioStarted) {
        this.audio.init();
        this.audioStarted = true;
      }
      this.score = 0;
      this.treasures = 0;
      this.initLevel(1);
      this.state = GameState.PLAYING;
      this.ui.triggerLevelFlash(1);
    }
  }

  private updatePlaying(dt: number): void {
    const { platforms } = this.levelData;

    // Drip sounds
    this.dripTimer -= dt;
    if (this.dripTimer <= 0) {
      this.dripTimer = DRIP_INTERVAL + Math.random() * 5000;
      this.audio.scheduleDrip(Math.random() * 1000);
    }

    // Pause
    if (this.input.pause()) { this.state = GameState.PAUSED; return; }

    if (this.respawnQueued) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.dino.respawn(this.checkpointX, this.checkpointY);
        this.respawnQueued = false;
      }
      return;
    }

    // Update dino
    this.dino.update(dt, platforms, this.input);

    // Update companion
    this.companion.update(dt, platforms, this.dino.x, this.dino.y);

    // Camera
    this.camera.follow(this.dino.x, this.dino.y, this.dino.w, this.dino.h);
    this.camera.update(dt);

    // Debris spawner
    this.debrisSpawnTimer -= dt;
    if (this.debrisSpawnTimer <= 0 && !this.dino.isDying) {
      this.debrisSpawnTimer = this.debrisSpawnInterval + Math.random() * 1000;
      this.spawnDebris();
    }

    // Update debris
    this.debrisList.forEach((d) => d.update(dt, platforms));
    this.debrisList = this.debrisList.filter((d) => !d.dead || d.isShattered);

    // Update treasures
    this.treasureList.forEach((t) => t.update(dt, platforms));

    // Update merchant
    this.merchant.update(dt, platforms, this.dino.x);

    // Update enemies
    this.enemies.forEach((e) => e.update(dt, platforms, this.dino.x, this.dino.y));
    this.enemies = this.enemies.filter((e) => !e.dead);

    // Update boss
    if (this.boss) {
      this.boss.update(dt, platforms, this.dino.x, this.dino.y);
      // Boss debris requests
      while (this.boss.debrisRequests.length > 0) {
        const req = this.boss.debrisRequests.shift()!;
        this.debrisList.push(new Debris(req.x, 30, this.levelNum));
      }
      if (this.boss.dead) {
        this.boss = null;
        this.treasures += 10;
        this.score += 500;
        this.audio.playTreasure();
      }
    }

    // Collect treasures
    this.treasureList.forEach((t) => {
      if (!t.collected && this.dino.overlapsEntity(t)) {
        t.collected = true;
        this.treasures += t.value;
        this.score += t.value * 10;
        this.audio.playTreasure();
      }
    });
    this.treasureList = this.treasureList.filter((t) => !t.collected);

    // Dino fire vs enemies/boss
    this.dino.fireBalls.forEach((fb) => {
      this.enemies.forEach((e) => {
        if (!fb.dead && fb.overlapsEntity(e)) {
          const died = e.takeDamage(fb.damage);
          fb.dead = true;
          if (died) {
            this.score += 50;
            this.audio.playEnemyDie();
            if (Math.random() > 0.5) {
              this.treasureList.push(new Treasure(e.x, e.y, "gem"));
            }
          }
        }
      });
      if (this.boss && !fb.dead && fb.overlapsEntity(this.boss)) {
        this.boss.takeDamage(fb.damage);
        fb.dead = true;
      }
    });

    // Falling debris vs dino/companion
    this.debrisList.forEach((d) => {
      if (d.isFalling) {
        if (d.overlapsEntity(this.dino) && !this.dino.isDying) {
          const died = this.dino.takeDamage();
          if (died) {
            this.audio.playDeath();
            this.camera.shake(10, 600);
            this.queueRespawn();
          } else {
            this.audio.playHit();
            this.ui.triggerDamageFlash();
            this.camera.shake(5, 300);
          }
        }
        if (d.overlapsEntity(this.companion) && this.companion.alive) {
          this.companion.die();
          this.audio.playCompanionScream();
        }
      }
    });

    // Enemy contact vs dino/companion
    this.enemies.forEach((e) => {
      if (e.overlapsEntity(this.dino) && !this.dino.isDying) {
        const died = this.dino.takeDamage();
        if (died) {
          this.audio.playDeath();
          this.queueRespawn();
        } else {
          this.audio.playHit();
          this.ui.triggerDamageFlash();
        }
      }
      if (e.overlapsEntity(this.companion) && this.companion.alive) {
        this.companion.die();
        this.audio.playCompanionScream();
      }
    });

    // Boss contact vs dino
    if (this.boss && this.boss.overlapsEntity(this.dino) && !this.dino.isDying) {
      const died = this.dino.takeDamage();
      if (died) {
        this.audio.playDeath();
        this.queueRespawn();
      } else {
        this.audio.playHit();
        this.ui.triggerDamageFlash();
        this.camera.shake(8, 400);
      }
    }

    // Open shop
    if (this.merchant.nearPlayer && this.input.interact()) {
      this.state = GameState.SHOP;
      this.shopSelectedIdx = 0;
      return;
    }

    // Checkpoints
    this.levelData.checkpoints.forEach((cp) => {
      if (!cp.reached && Math.abs(this.dino.x - cp.x) < 40 && Math.abs(this.dino.y - cp.y) < 60) {
        cp.reached = true;
        this.checkpointX = cp.x;
        this.checkpointY = cp.y;
        this.audio.playCheckpoint();
        this.ui.triggerCheckpointFlash();
      }
    });

    // Fireball audio
    if (this.input.fire()) this.audio.playFire();

    // Jump audio
    if (this.input.jump()) this.audio.playJump();

    // Exit detection
    const exitX = this.levelData.exitX;
    const floorY = LEVEL_HEIGHT - 30;
    if (
      this.dino.x > exitX &&
      this.dino.x < exitX + 80 &&
      this.dino.y + this.dino.h >= floorY - 5
    ) {
      this.completeLevel();
    }

    // Dino fell off map
    if (this.dino.y > LEVEL_HEIGHT + 100 && !this.dino.isDying) {
      this.dino.isDying = true;
      this.queueRespawn();
    }
  }

  private spawnDebris(): void {
    const spawners = this.levelData.debrisSpawners;
    if (spawners.length === 0) return;
    // Prefer spawners near the dino
    const nearby = spawners.filter((s) => Math.abs(s.x - this.dino.x) < 400);
    const pool = nearby.length > 0 ? nearby : spawners;
    const s = pool[Math.floor(Math.random() * pool.length)];
    this.debrisList.push(new Debris(s.x + (Math.random() - 0.5) * 80, s.ceilY, this.levelNum));
    if (Math.random() > 0.6 && this.levelNum > 3) {
      const s2 = pool[Math.floor(Math.random() * pool.length)];
      this.debrisList.push(new Debris(s2.x + (Math.random() - 0.5) * 100, s2.ceilY, this.levelNum));
    }
    this.audio.playDebrisWarn();
  }

  private queueRespawn(): void {
    if (this.respawnQueued) return;
    if (this.dino.hp <= 0) {
      // Last life — game over after death anim
      setTimeout(() => {
        this.saveSave();
        this.state = GameState.GAME_OVER;
      }, 900);
      return;
    }
    this.respawnQueued = true;
    this.respawnTimer = 900;
  }

  private completeLevel(): void {
    this.score += 100 + this.levelNum * 20;
    this.audio.playLevelComplete();
    this.state = GameState.LEVEL_WIN;
  }

  private levelWinTimer = 0;

  private updateLevelWin(dt: number): void {
    this.levelWinTimer += dt;
    if (this.levelWinTimer > 1800) {
      this.levelWinTimer = 0;
      const next = this.levelNum + 1;
      // Transfer upgrades to new level
      const prevUpgrades = { ...this.dino.upgrades };
      const prevHp = this.dino.hp;
      this.initLevel(next);
      this.dino.upgrades = prevUpgrades;
      this.dino.maxHp = prevUpgrades.maxHearts;
      this.dino.hp = Math.min(prevHp, prevUpgrades.maxHearts);
      this.state = GameState.PLAYING;
      this.ui.triggerLevelFlash(next);
    }
  }

  private updateShop(dt: number): void {
    const cols = 3;
    const items = SHOP_ITEMS;

    if (this.input.pressed("ArrowRight") || this.input.pressed("KeyD")) {
      this.shopSelectedIdx = (this.shopSelectedIdx + 1) % items.length;
    }
    if (this.input.pressed("ArrowLeft") || this.input.pressed("KeyA")) {
      this.shopSelectedIdx = (this.shopSelectedIdx - 1 + items.length) % items.length;
    }
    if (this.input.pressed("ArrowDown") || this.input.pressed("KeyS")) {
      this.shopSelectedIdx = Math.min(this.shopSelectedIdx + cols, items.length - 1);
    }
    if (this.input.pressed("ArrowUp") || this.input.pressed("KeyW")) {
      this.shopSelectedIdx = Math.max(this.shopSelectedIdx - cols, 0);
    }

    if (this.input.confirm()) {
      this.tryBuy(items[this.shopSelectedIdx].id);
    }

    if (this.input.interact() || this.input.pause()) {
      this.state = GameState.PLAYING;
    }
  }

  private tryBuy(itemId: string): void {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    const u = this.dino.upgrades;

    // Check maxed
    if (itemId === "doublejump" && u.doubleJump) return;
    if (itemId === "fire" && u.fireLevel >= 3) return;
    if (itemId === "speed" && u.speedLevel >= 3) return;
    if (itemId === "revive" && this.companion.alive) return;
    if (itemId === "heart" && u.maxHearts >= 6) return;
    if (itemId === "shield" && u.shieldActive) return;

    if (this.treasures < item.cost) return;

    this.treasures -= item.cost;
    this.audio.playBuy();

    switch (itemId) {
      case "shield":     u.shieldActive = true; break;
      case "fire":       u.fireLevel = Math.min(3, u.fireLevel + 1); break;
      case "speed":      u.speedLevel = Math.min(3, u.speedLevel + 1); break;
      case "doublejump": u.doubleJump = true; break;
      case "heart":
        u.maxHearts = Math.min(6, u.maxHearts + 1);
        this.dino.maxHp = u.maxHearts;
        this.dino.hp = Math.min(this.dino.hp + 1, this.dino.maxHp);
        break;
      case "revive":
        this.companion.revive(this.dino.x - 50, this.dino.y);
        break;
    }
  }

  private updatePaused(_dt: number): void {
    if (this.input.pause()) this.state = GameState.PLAYING;
  }

  private updateGameOver(_dt: number): void {
    if (this.input.confirm()) {
      this.state = GameState.MENU;
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (this.state === GameState.MENU) {
      this.drawMenuBg();
      this.ui.drawMenu(ctx, this.highScore, this.depthRecord);
      return;
    }

    if (this.state === GameState.GAME_OVER) {
      this.drawMenuBg();
      this.ui.drawGameOver(ctx, this.score, this.levelNum, this.highScore, this.depthRecord);
      return;
    }

    const { camX, camY } = { camX: this.camera.x, camY: this.camera.y };
    const { platforms, checkpoints, exitX } = this.levelData;

    // Background
    this.renderer.drawBackground(camX, camY, this.levelNum);

    // Crystals
    this.renderer.drawCrystals(this.crystals, camX, camY);

    // Stalactites
    this.renderer.drawStalactites(this.stalactites, camX, camY);

    // Platforms
    this.renderer.drawPlatforms(platforms, camX, camY, this.levelNum);

    // Exit
    this.renderer.drawExit(exitX, camX, camY, this.levelNum);

    // Checkpoints
    checkpoints.forEach((cp) => {
      this.renderer.drawCheckpointMarker(cp.x, cp.y, camX, camY, cp.reached);
    });

    // Treasures
    this.treasureList.forEach((t) => t.draw(ctx, camX, camY));

    // Merchant
    this.merchant.draw(ctx, camX, camY);

    // Enemies
    this.enemies.forEach((e) => e.draw(ctx, camX, camY));

    // Boss
    if (this.boss) this.boss.draw(ctx, camX, camY);

    // Companion
    this.companion.draw(ctx, camX, camY);

    // Dino fireballs
    this.dino.fireBalls.forEach((fb) => fb.draw(ctx, camX, camY));

    // Dino
    this.dino.draw(ctx, camX, camY);

    // Debris
    this.debrisList.forEach((d) => d.draw(ctx, camX, camY));

    // Fog overlay
    this.renderer.drawFog(camX, camY, this.levelNum);

    // HUD
    this.ui.drawHUD(
      ctx,
      this.dino.hp,
      this.dino.maxHp,
      this.treasures,
      this.levelNum,
      this.dino.upgrades,
      this.companion.alive,
      this.depthRecord,
    );

    // State overlays
    if (this.state === GameState.SHOP) {
      this.ui.drawShop(ctx, this.treasures, this.shopSelectedIdx, this.dino.upgrades, this.companion.alive);
    }
    if (this.state === GameState.PAUSED) {
      this.ui.drawPauseMenu(ctx);
    }
    if (this.state === GameState.LEVEL_WIN) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.levelWinTimer / 600)})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  private drawMenuBg(): void {
    this.ctx.fillStyle = "#020208";
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Subtle animated dots
    const t = Date.now() * 0.0005;
    for (let i = 0; i < 30; i++) {
      const x = ((i * 137 + Math.cos(t + i) * 20) % CANVAS_W + CANVAS_W) % CANVAS_W;
      const y = ((i * 97 + Math.sin(t * 0.7 + i) * 15) % CANVAS_H + CANVAS_H) % CANVAS_H;
      const a = (Math.sin(t * 2 + i) + 1) * 0.5 * 0.15;
      this.ctx.fillStyle = `rgba(80,80,200,${a})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
