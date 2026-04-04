import { Entity } from "./Entity.js";
import { Platform, UpgradeState } from "../types.js";
import {
  DINO_W, DINO_H, DINO_SPEED_BASE, DINO_JUMP_FORCE,
  DINO_HEALTH_BASE, COLORS
} from "../constants.js";
import { Input } from "../Input.js";
import { FireBall } from "./FireBall.js";

const INVINCIBILITY_MS = 1200;
const FIRE_COOLDOWN_BASE = 420;

export class Dino extends Entity {
  hp: number;
  maxHp: number;
  upgrades: UpgradeState;
  fireBalls: FireBall[] = [];
  private fireCooldown = 0;
  private invincibilityTimer = 0;
  private jumpCount = 0;
  private walkAnim = 0;
  private deathTimer = 0;
  isDying = false;
  private tailWag = 0;

  constructor(x: number, y: number) {
    super(x, y, DINO_W, DINO_H);
    this.maxHp = DINO_HEALTH_BASE;
    this.hp = this.maxHp;
    this.upgrades = {
      fireLevel: 0,
      speedLevel: 0,
      doubleJump: false,
      maxHearts: DINO_HEALTH_BASE,
      shieldActive: false,
      shieldCooldownMs: 0,
    };
  }

  get speed(): number {
    return DINO_SPEED_BASE + this.upgrades.speedLevel * 0.9;
  }

  get fireCooldownMs(): number {
    return Math.max(150, FIRE_COOLDOWN_BASE - this.upgrades.fireLevel * 80);
  }

  update(dt: number, platforms: Platform[], input?: Input): void {
    if (this.isDying) {
      this.deathTimer -= dt;
      this.vy += 0.3;
      this.y += this.vy;
      return;
    }

    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.invincibilityTimer = Math.max(0, this.invincibilityTimer - dt);
    this.tailWag += 0.1;

    if (input) {
      if (input.left()) { this.vx = -this.speed; this.facingRight = false; }
      else if (input.right()) { this.vx = this.speed; this.facingRight = true; }
      else this.vx *= 0.7;

      if (input.jump()) this.tryJump();
      if (input.fire()) this.tryFire();
    }

    this.applyGravity();
    this.moveAndCollide(platforms);

    if (this.onGround) this.jumpCount = 0;

    this.walkAnim += Math.abs(this.vx) * 0.1;
    this.fireBalls = this.fireBalls.filter((f) => !f.dead);
    this.fireBalls.forEach((f) => f.update(dt, platforms));
  }

  private tryJump(): void {
    const maxJumps = this.upgrades.doubleJump ? 2 : 1;
    if (this.jumpCount < maxJumps) {
      this.vy = DINO_JUMP_FORCE - this.upgrades.speedLevel * 0.4;
      this.jumpCount++;
      this.onGround = false;
    }
  }

  private tryFire(): void {
    if (this.fireCooldown > 0) return;
    this.fireCooldown = this.fireCooldownMs;
    const bx = this.facingRight ? this.x + this.w + 2 : this.x - 16;
    const by = this.y + this.h * 0.35;
    this.fireBalls.push(new FireBall(bx, by, this.facingRight, this.upgrades.fireLevel));
  }

  takeDamage(): boolean {
    if (this.invincibilityTimer > 0) return false;
    if (this.upgrades.shieldActive) {
      this.upgrades.shieldActive = false;
      this.invincibilityTimer = INVINCIBILITY_MS * 0.5;
      return false;
    }
    this.hp--;
    this.invincibilityTimer = INVINCIBILITY_MS;
    if (this.hp <= 0) {
      this.isDying = true;
      this.deathTimer = 800;
      this.vy = -8;
      return true;
    }
    return false;
  }

  respawn(x: number, y: number): void {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.isDying = false;
    this.deathTimer = 0;
    this.invincibilityTimer = 600;
    this.fireBalls = [];
    if (this.hp <= 0) this.hp = 1;
  }

  isInvincible(): boolean { return this.invincibilityTimer > 0; }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sx = this.x - camX;
    const sy = this.y - camY;

    if (this.isDying) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.deathTimer / 800);
      this.drawBody(ctx, sx, sy, 1);
      ctx.restore();
      return;
    }

    const flicker = this.invincibilityTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;
    if (flicker) return;

    ctx.save();
    this.drawBody(ctx, sx, sy, 0);
    ctx.restore();
  }

  private drawBody(ctx: CanvasRenderingContext2D, sx: number, sy: number, deathMode: number): void {
    const flip = !this.facingRight;
    ctx.save();
    if (flip) {
      ctx.translate(sx + this.w, sy);
      ctx.scale(-1, 1);
      ctx.translate(-this.w, 0);
    } else {
      ctx.translate(sx, sy);
    }

    const legOff = Math.sin(this.walkAnim) * 4;

    // tail
    ctx.fillStyle = COLORS.dino;
    ctx.beginPath();
    const tw = Math.sin(this.tailWag) * 3;
    ctx.moveTo(2, this.h * 0.5);
    ctx.quadraticCurveTo(-10 + tw, this.h * 0.55 + tw, -14, this.h * 0.7 + tw * 0.5);
    ctx.quadraticCurveTo(-10, this.h * 0.85, 2, this.h * 0.7);
    ctx.fill();

    // body
    ctx.fillStyle = COLORS.dino;
    ctx.beginPath();
    ctx.roundRect(3, this.h * 0.2, this.w - 3, this.h * 0.65, 6);
    ctx.fill();

    // neck + head
    ctx.fillStyle = COLORS.dino;
    ctx.beginPath();
    ctx.roundRect(this.w * 0.45, 0, this.w * 0.55, this.h * 0.4, 5);
    ctx.fill();

    // eye
    ctx.fillStyle = COLORS.dinoEye;
    ctx.beginPath();
    ctx.ellipse(this.w * 0.85, this.h * 0.12, 3.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // pupil
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(this.w * 0.87, this.h * 0.13, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // eye glow
    ctx.shadowColor = COLORS.dinoEye;
    ctx.shadowBlur = 8;
    ctx.fillStyle = COLORS.dinoEye;
    ctx.beginPath();
    ctx.ellipse(this.w * 0.85, this.h * 0.12, 3.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // legs
    ctx.fillStyle = COLORS.dino;
    ctx.fillRect(this.w * 0.25, this.h * 0.75 + legOff, 6, this.h * 0.25 - legOff);
    ctx.fillRect(this.w * 0.55, this.h * 0.75 - legOff, 6, this.h * 0.25 + legOff);

    // shield
    if (this.upgrades.shieldActive) {
      ctx.strokeStyle = "rgba(80,160,255,0.7)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#4488ff";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(this.w * 0.5, this.h * 0.5, this.w * 0.75, this.h * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}
