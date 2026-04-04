import { Entity } from "./Entity.js";
import { Platform } from "../types.js";
import { BOSS_W, BOSS_H, COLORS } from "../constants.js";

type BossPhase = 1 | 2;

export class Boss extends Entity {
  maxHp: number;
  hp: number;
  phase: BossPhase = 1;
  private anim = 0;
  private moveTimer = 0;
  private chargeTimer = 0;
  private isCharging = false;
  private roarTimer = 0;
  private eyePulse = 0;
  debrisRequests: { x: number }[] = [];

  constructor(x: number, y: number, levelNum: number) {
    super(x, y, BOSS_W, BOSS_H);
    const scale = 1 + (levelNum - 5) * 0.08;
    this.maxHp = Math.floor(15 * scale);
    this.hp = this.maxHp;
    this.facingRight = false;
  }

  get hpFraction(): number { return this.hp / this.maxHp; }

  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
    }
    if (this.hp <= 0) { this.dead = true; return true; }
    return false;
  }

  update(dt: number, platforms: Platform[], playerX?: number, _playerY?: number): void {
    this.anim += dt * 0.004;
    this.eyePulse += dt * 0.006;
    this.moveTimer += dt;
    this.roarTimer = Math.max(0, this.roarTimer - dt);

    if (playerX !== undefined) {
      this.facingRight = playerX > this.x;
    }

    const speed = this.phase === 1 ? 1.2 : 2.2;

    if (this.isCharging) {
      this.vx = this.facingRight ? speed * 3.5 : -speed * 3.5;
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.isCharging = false;
        this.vx = 0;
      }
    } else {
      // patrol toward player
      if (playerX !== undefined) {
        const dx = playerX - this.x;
        if (Math.abs(dx) > 50) {
          this.vx = Math.sign(dx) * speed;
        } else {
          this.vx = 0;
        }
      }
      // random debris
      if (this.moveTimer > (this.phase === 1 ? 2200 : 1200)) {
        this.moveTimer = 0;
        this.debrisRequests.push({ x: this.x + (Math.random() - 0.5) * 200 });
        if (this.phase === 2) {
          this.debrisRequests.push({ x: this.x + (Math.random() - 0.5) * 300 });
        }
        // charge in phase 2
        if (this.phase === 2 && Math.random() > 0.4) {
          this.isCharging = true;
          this.chargeTimer = 600;
        }
      }
    }

    this.applyGravity();
    this.moveAndCollide(platforms);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sx = this.x - camX;
    const sy = this.y - camY;
    const breathe = Math.sin(this.anim * 1.5) * 3;
    const eyeGlow = (Math.sin(this.eyePulse * 3) + 1) * 0.5;

    ctx.save();

    const flip = !this.facingRight;
    if (flip) {
      ctx.translate(sx + this.w, sy);
      ctx.scale(-1, 1);
      ctx.translate(-this.w, 0);
    } else {
      ctx.translate(sx, sy);
    }

    // body glow
    const grad = ctx.createRadialGradient(this.w / 2, this.h / 2, 10, this.w / 2, this.h / 2, this.w * 0.7);
    grad.addColorStop(0, "rgba(150,0,0,0.1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(this.w / 2, this.h / 2, this.w * 0.7, this.h * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // tail
    ctx.fillStyle = COLORS.bossColor;
    ctx.beginPath();
    ctx.moveTo(2, this.h * 0.6);
    ctx.quadraticCurveTo(-20, this.h * 0.7, -30, this.h * 0.9);
    ctx.quadraticCurveTo(-18, this.h, 2, this.h * 0.8);
    ctx.fill();

    // body
    ctx.fillStyle = COLORS.bossColor;
    ctx.beginPath();
    ctx.roundRect(4, this.h * 0.15 + breathe, this.w - 8, this.h * 0.75, 10);
    ctx.fill();

    // spikes on back
    ctx.fillStyle = "#330000";
    for (let i = 0; i < 5; i++) {
      const sx2 = 10 + i * 15;
      ctx.beginPath();
      ctx.moveTo(sx2, this.h * 0.15 + breathe);
      ctx.lineTo(sx2 + 6, this.h * 0.15 + breathe);
      ctx.lineTo(sx2 + 3, this.h * 0.15 + breathe - 14 - i * 2);
      ctx.closePath();
      ctx.fill();
    }

    // head
    ctx.fillStyle = COLORS.bossColor;
    ctx.beginPath();
    ctx.roundRect(this.w * 0.5, this.h * 0.05, this.w * 0.5, this.h * 0.4, 8);
    ctx.fill();

    // jaw
    ctx.beginPath();
    ctx.roundRect(this.w * 0.55, this.h * 0.28 + breathe * 0.5, this.w * 0.44, this.h * 0.15, 4);
    ctx.fill();

    // teeth
    ctx.fillStyle = "#ffeecc";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(this.w * 0.58 + i * 9, this.h * 0.28);
      ctx.lineTo(this.w * 0.58 + i * 9 + 4, this.h * 0.28);
      ctx.lineTo(this.w * 0.58 + i * 9 + 2, this.h * 0.36);
      ctx.closePath();
      ctx.fill();
    }

    // eyes
    const eyeColor = this.phase === 2 ? "#ff2200" : COLORS.bossEye;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = 12 + eyeGlow * 10;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(this.w * 0.7, this.h * 0.14, 7, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.w * 0.88, this.h * 0.14, 7, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // arms
    ctx.fillStyle = COLORS.bossColor;
    ctx.beginPath();
    ctx.roundRect(-12, this.h * 0.35 + breathe, 14, this.h * 0.3, 4);
    ctx.fill();

    // claws
    ctx.strokeStyle = "#440000";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-12, this.h * 0.62 + breathe);
      ctx.lineTo(-12 - (i - 1) * 5, this.h * 0.72 + breathe);
      ctx.stroke();
    }

    // legs
    ctx.fillStyle = COLORS.bossColor;
    ctx.fillRect(this.w * 0.25, this.h * 0.85, 14, this.h * 0.18);
    ctx.fillRect(this.w * 0.5, this.h * 0.85, 14, this.h * 0.18);

    ctx.restore();

    // HP bar
    const barW = this.w + 20;
    const barX = sx - 10;
    const barY = sy - 18;
    ctx.fillStyle = "#220000";
    ctx.fillRect(barX, barY, barW, 8);
    ctx.fillStyle = this.phase === 2 ? "#ff2200" : "#aa0000";
    ctx.fillRect(barX, barY, barW * this.hpFraction, 8);
    ctx.strokeStyle = "#440000";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, 8);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DINO BOSS", sx + this.w / 2, barY - 4);
  }
}
