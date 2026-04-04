import { Entity } from "./Entity.js";
import { Platform, Particle } from "../types.js";
import { DEBRIS_W, DEBRIS_H, DEBRIS_WARN_MS, DEBRIS_FALL_SPEED_BASE, COLORS } from "../constants.js";

type DebrisState = "warning" | "falling" | "shattered";

export class Debris extends Entity {
  private state: DebrisState = "warning";
  private timer: number;
  private fallSpeed: number;
  private particles: Particle[] = [];
  private warnAlpha = 0;
  private warnPulse = 0;
  readonly ceilY: number;

  constructor(x: number, ceilY: number, levelNum: number) {
    super(x, ceilY, DEBRIS_W, DEBRIS_H);
    this.ceilY = ceilY;
    this.y = ceilY;
    const warnTime = Math.max(400, DEBRIS_WARN_MS - levelNum * 40);
    this.timer = warnTime;
    this.fallSpeed = DEBRIS_FALL_SPEED_BASE + levelNum * 0.3;
  }

  get isWarning(): boolean { return this.state === "warning"; }
  get isFalling(): boolean { return this.state === "falling"; }
  get isShattered(): boolean { return this.state === "shattered"; }

  update(dt: number, platforms: Platform[]): void {
    this.warnPulse += dt * 0.005;

    if (this.state === "warning") {
      this.timer -= dt;
      this.warnAlpha = (Math.sin(this.warnPulse * 6) + 1) * 0.5;
      if (this.timer <= 0) {
        this.state = "falling";
        this.vy = this.fallSpeed;
      }
      return;
    }

    if (this.state === "falling") {
      this.y += this.vy;
      // check hit ground or platform
      for (const p of platforms) {
        if (this.overlaps(p)) {
          this.state = "shattered";
          this.dead = false;
          this.spawnShatterParticles();
          this.timer = 600;
          return;
        }
      }
      return;
    }

    if (this.state === "shattered") {
      this.timer -= dt;
      this.particles = this.particles.filter((p) => p.life > 0);
      this.particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.15;
        p.life -= dt / 600;
      });
      if (this.timer <= 0) this.dead = true;
    }
  }

  private spawnShatterParticles(): void {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI;
      const spd = 1 + Math.random() * 4;
      this.particles.push({
        x: this.centerX(),
        y: this.y + this.h,
        vx: Math.cos(angle) * spd,
        vy: -Math.sin(angle) * spd * 0.8,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 5,
        color: COLORS.debrisColor,
        gravity: true,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sx = this.x - camX;
    const sy = this.y - camY;

    if (this.state === "warning") {
      // crack on ceiling
      ctx.save();
      ctx.globalAlpha = 0.5 + this.warnAlpha * 0.5;
      ctx.strokeStyle = "#ff3300";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#ff3300";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(sx + this.w * 0.5, sy + this.h * 0.3);
      ctx.lineTo(sx + this.w * 0.35, sy + this.h * 0.7);
      ctx.moveTo(sx + this.w * 0.5, sy + this.h * 0.3);
      ctx.lineTo(sx + this.w * 0.65, sy + this.h * 0.8);
      ctx.moveTo(sx + this.w * 0.5, sy + this.h * 0.3);
      ctx.lineTo(sx + this.w * 0.2, sy + this.h * 0.5);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }

    if (this.state === "falling") {
      ctx.save();
      ctx.fillStyle = COLORS.debrisColor;
      ctx.beginPath();
      ctx.moveTo(sx + this.w * 0.5, sy);
      ctx.lineTo(sx + this.w * 0.1, sy + this.h * 0.4);
      ctx.lineTo(sx, sy + this.h);
      ctx.lineTo(sx + this.w * 0.4, sy + this.h * 0.85);
      ctx.lineTo(sx + this.w, sy + this.h * 0.95);
      ctx.lineTo(sx + this.w * 0.9, sy + this.h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    // shattered
    this.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - camX - p.size / 2, p.y - camY - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }
}
