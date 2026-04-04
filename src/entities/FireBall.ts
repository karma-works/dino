import { Entity } from "./Entity.js";
import { Platform, Particle } from "../types.js";
import { FIRE_SPEED, FIRE_W, FIRE_H, COLORS, LEVEL_WIDTH } from "../constants.js";

export class FireBall extends Entity {
  private age = 0;
  private particles: Particle[] = [];
  damage: number;
  private goingRight: boolean;

  constructor(x: number, y: number, goingRight: boolean, fireLevel: number) {
    super(x, y, FIRE_W, FIRE_H);
    this.goingRight = goingRight;
    this.vx = goingRight ? FIRE_SPEED + fireLevel * 1.5 : -(FIRE_SPEED + fireLevel * 1.5);
    this.damage = 1 + fireLevel;
    this.facingRight = goingRight;
  }

  update(dt: number, platforms: Platform[]): void {
    this.age += dt;
    if (this.x < 0 || this.x > LEVEL_WIDTH) { this.dead = true; return; }

    this.x += this.vx;
    // wall collision
    for (const p of platforms) {
      if (this.overlaps(p)) {
        this.dead = true;
        this.spawnImpactParticles();
        return;
      }
    }
    this.spawnTrailParticle();
    this.particles = this.particles.filter((p) => p.life > 0);
    this.particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.08;
      p.life -= 1 / 30;
    });
    if (this.age > 2000) this.dead = true;
  }

  private spawnTrailParticle(): void {
    this.particles.push({
      x: this.x + this.w * 0.5 + (Math.random() - 0.5) * 4,
      y: this.y + this.h * 0.5 + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 1.5,
      life: 1,
      maxLife: 1,
      size: 3 + Math.random() * 4,
      color: Math.random() > 0.5 ? COLORS.fire0 : COLORS.fire1,
    });
  }

  private spawnImpactParticles(): void {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.centerX(),
        y: this.centerY(),
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        maxLife: 1,
        size: 4 + Math.random() * 6,
        color: Math.random() > 0.5 ? COLORS.fire0 : COLORS.fire1,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sx = this.x - camX;
    const sy = this.y - camY;

    this.particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y - camY, Math.max(0.1, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (this.dead) return;

    ctx.save();
    ctx.shadowColor = COLORS.fire1;
    ctx.shadowBlur = 14;
    const grad = ctx.createRadialGradient(sx + this.w / 2, sy + this.h / 2, 1, sx + this.w / 2, sy + this.h / 2, this.w / 2);
    grad.addColorStop(0, COLORS.fire1);
    grad.addColorStop(1, COLORS.fire0);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx + this.w / 2, sy + this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
