import { Entity } from "./Entity.js";
import { Platform } from "../types.js";
import { MERCHANT_W, MERCHANT_H, MERCHANT_INTERACT_DIST, COLORS } from "../constants.js";

export class Merchant extends Entity {
  nearPlayer = false;
  private robeWave = 0;
  private lanternGlow = 0;

  constructor(x: number, y: number) {
    super(x, y, MERCHANT_W, MERCHANT_H);
  }

  update(dt: number, _platforms: Platform[], playerX?: number): void {
    this.robeWave += dt * 0.002;
    this.lanternGlow += dt * 0.004;
    this.nearPlayer = playerX !== undefined &&
      Math.abs(playerX - this.x) < MERCHANT_INTERACT_DIST;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sx = this.x - camX;
    const sy = this.y - camY;
    const waveX = Math.sin(this.robeWave) * 1.5;
    const glow = (Math.sin(this.lanternGlow * 2) + 1) * 0.5;

    ctx.save();

    // lantern glow
    const lx = sx + this.w + 8;
    const ly = sy + this.h * 0.3;
    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 30 + glow * 10);
    grad.addColorStop(0, "rgba(255,180,50,0.18)");
    grad.addColorStop(1, "rgba(255,180,50,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lx, ly, 30 + glow * 10, 0, Math.PI * 2);
    ctx.fill();

    // robe
    ctx.fillStyle = COLORS.merchantRobe;
    ctx.beginPath();
    ctx.moveTo(sx + this.w * 0.1 + waveX, sy + this.h * 0.25);
    ctx.lineTo(sx - 2 + waveX, sy + this.h);
    ctx.lineTo(sx + this.w + 2 - waveX, sy + this.h);
    ctx.lineTo(sx + this.w * 0.9 - waveX, sy + this.h * 0.25);
    ctx.closePath();
    ctx.fill();

    // hood
    ctx.fillStyle = "#120820";
    ctx.beginPath();
    ctx.arc(sx + this.w / 2, sy + this.h * 0.2, this.w * 0.45, Math.PI, 0);
    ctx.lineTo(sx + this.w * 0.9, sy + this.h * 0.35);
    ctx.lineTo(sx + this.w * 0.1, sy + this.h * 0.35);
    ctx.closePath();
    ctx.fill();

    // glowing eyes under hood
    ctx.shadowColor = "#aa44ff";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#aa44ff";
    ctx.beginPath();
    ctx.ellipse(sx + this.w * 0.35, sy + this.h * 0.22, 2, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(sx + this.w * 0.65, sy + this.h * 0.22, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // lantern
    ctx.fillStyle = "#ffbb33";
    ctx.shadowColor = "#ffaa00";
    ctx.shadowBlur = 8 + glow * 6;
    ctx.beginPath();
    ctx.roundRect(lx - 5, ly - 8, 10, 14, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // arm holding lantern
    ctx.fillStyle = COLORS.merchantRobe;
    ctx.fillRect(sx + this.w - 3, sy + this.h * 0.3, 14, 4);

    // interact prompt
    if (this.nearPlayer) {
      ctx.fillStyle = "rgba(200,200,255,0.85)";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("[E] Trade", sx + this.w / 2, sy - 8);
    }

    ctx.restore();
  }
}
