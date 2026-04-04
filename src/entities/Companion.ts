import { Entity } from "./Entity.js";
import { Platform } from "../types.js";
import { COMPANION_W, COMPANION_H, COMPANION_SPEED, COLORS } from "../constants.js";

const JUMP_THRESHOLD = 60;

export class Companion extends Entity {
  alive = true;
  private walkAnim = 0;
  private jumpCooldown = 0;
  private deathAnim = 0;
  private targetX = 0;
  private fearPulse = 0;

  constructor(x: number, y: number) {
    super(x, y, COMPANION_W, COMPANION_H);
  }

  revive(x: number, y: number): void {
    this.alive = true;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.deathAnim = 0;
  }

  die(): void {
    if (!this.alive) return;
    this.alive = false;
    this.deathAnim = 1;
    this.vy = -7;
    this.vx = (Math.random() - 0.5) * 4;
  }

  update(dt: number, platforms: Platform[], dinoX?: number, dinoY?: number): void {
    this.fearPulse += 0.05;
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);

    if (!this.alive) {
      // ragdoll
      if (this.deathAnim > 0) {
        this.applyGravity();
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        for (const p of platforms) {
          if (this.overlaps(p) && this.vy > 0) {
            this.y = p.y - this.h;
            this.vy *= -0.2;
            this.vx *= 0.7;
          }
        }
        this.deathAnim -= dt / 3000;
      }
      return;
    }

    if (dinoX !== undefined && dinoY !== undefined) {
      this.targetX = dinoX - 40;
      const dx = this.targetX - this.x;

      if (Math.abs(dx) > 8) {
        const dir = Math.sign(dx);
        this.vx = dir * Math.min(COMPANION_SPEED, Math.abs(dx) * 0.15 + 1.5);
        this.facingRight = dir > 0;
      } else {
        this.vx *= 0.6;
      }

      // Jump if dino is above and companion is on ground
      if (dinoY < this.y - 20 && this.onGround && this.jumpCooldown <= 0) {
        this.vy = -11;
        this.jumpCooldown = 800;
        this.onGround = false;
      }

      // Jump over gaps
      if (this.onGround && this.jumpCooldown <= 0) {
        const ahead = this.facingRight ? this.x + this.w + 10 : this.x - 10;
        const belowAhead = this.y + this.h + 5;
        let hasGround = false;
        for (const p of platforms) {
          if (ahead >= p.x && ahead <= p.x + p.w && belowAhead >= p.y && belowAhead <= p.y + p.h + 30) {
            hasGround = true; break;
          }
        }
        if (!hasGround && Math.abs(this.vx) > 1) {
          this.vy = -11;
          this.jumpCooldown = 600;
          this.onGround = false;
        }
      }
    }

    this.applyGravity();
    this.moveAndCollide(platforms);
    if (this.onGround) {
      this.walkAnim += Math.abs(this.vx) * 0.12;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sx = this.x - camX;
    const sy = this.y - camY;
    const alpha = this.alive ? 1 : Math.max(0, this.deathAnim);

    ctx.save();
    ctx.globalAlpha = alpha;

    const flip = !this.facingRight;
    if (flip) {
      ctx.translate(sx + this.w, sy);
      ctx.scale(-1, 1);
      ctx.translate(-this.w, 0);
    } else {
      ctx.translate(sx, sy);
    }

    const legSwing = Math.sin(this.walkAnim) * 5;
    const armSwing = Math.cos(this.walkAnim) * 4;

    // legs
    ctx.fillStyle = COLORS.companion;
    ctx.fillRect(this.w * 0.2, this.h * 0.65 + legSwing, 5, this.h * 0.35 - legSwing);
    ctx.fillRect(this.w * 0.55, this.h * 0.65 - legSwing, 5, this.h * 0.35 + legSwing);

    // torso
    ctx.fillStyle = COLORS.companion;
    ctx.beginPath();
    ctx.roundRect(this.w * 0.15, this.h * 0.35, this.w * 0.7, this.h * 0.35, 3);
    ctx.fill();

    // arms
    ctx.fillRect(0, this.h * 0.35 + armSwing, 5, this.h * 0.2);
    ctx.fillRect(this.w - 5, this.h * 0.35 - armSwing, 5, this.h * 0.2);

    // head
    ctx.beginPath();
    ctx.roundRect(this.w * 0.2, 0, this.w * 0.6, this.h * 0.38, 5);
    ctx.fill();

    // eyes
    const fearFactor = (Math.sin(this.fearPulse) + 1) * 0.5;
    ctx.fillStyle = `rgba(136,170,255,${0.6 + fearFactor * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(this.w * 0.35, this.h * 0.18, 2.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.w * 0.65, this.h * 0.18, 2.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // eye glow
    ctx.shadowColor = COLORS.companionEye;
    ctx.shadowBlur = 6;
    ctx.fillStyle = COLORS.companionEye;
    ctx.beginPath();
    ctx.ellipse(this.w * 0.35, this.h * 0.18, 2, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(this.w * 0.65, this.h * 0.18, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
