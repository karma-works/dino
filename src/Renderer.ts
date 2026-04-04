import {
  CANVAS_W, CANVAS_H, LEVEL_WIDTH, LEVEL_HEIGHT, COLORS
} from "./constants.js";
import { Platform } from "./types.js";
import { StalactiteData, CrystalData } from "./Level.js";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private crystalPulse = 0;
  private fogShift = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  update(dt: number): void {
    this.crystalPulse += dt * 0.002;
    this.fogShift += dt * 0.0003;
  }

  drawBackground(camX: number, camY: number, levelNum: number): void {
    const ctx = this.ctx;
    const depth = Math.min(levelNum / 30, 1);

    // Sky/cave gradient — deeper = bluer-black
    const r0 = Math.floor(3 + depth * 2);
    const g0 = Math.floor(3 + depth * 1);
    const b0 = Math.floor(8 + depth * 12);
    ctx.fillStyle = `rgb(${r0},${g0},${b0})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Parallax rock layers
    this.drawParallaxLayer(camX, camY, 0.15, depth);
    this.drawParallaxLayer(camX, camY, 0.35, depth);
  }

  private drawParallaxLayer(camX: number, camY: number, factor: number, depth: number): void {
    const ctx = this.ctx;
    const ox = camX * factor;
    const oy = camY * factor;
    ctx.fillStyle = `rgba(${10 + depth * 5},${8 + depth * 3},${20 + depth * 8},0.18)`;
    for (let i = 0; i < 8; i++) {
      const bx = ((i * 180 - ox % 180 + 180) % (CANVAS_W + 200)) - 100;
      const by = ((i * 140 - oy % 140 + 140) % (CANVAS_H + 200)) - 100;
      ctx.beginPath();
      ctx.roundRect(bx, by, 80 + i * 15, 60 + i * 10, 20);
      ctx.fill();
    }
  }

  drawCrystals(
    crystals: CrystalData[], camX: number, camY: number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    crystals.forEach((c) => {
      const sx = c.x - camX;
      const sy = c.y - camY;
      if (sx < -20 || sx > CANVAS_W + 20) return;
      const glow = (Math.sin(this.crystalPulse + c.x * 0.01) + 1) * 0.5;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 6 + glow * 8;
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.15 + glow * 0.12;
      ctx.beginPath();
      ctx.arc(sx, sy, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawPlatforms(platforms: Platform[], camX: number, camY: number, levelNum: number): void {
    const ctx = this.ctx;
    const depth = Math.min(levelNum / 30, 1);

    platforms.forEach((p) => {
      const sx = p.x - camX;
      const sy = p.y - camY;
      if (sx + p.w < 0 || sx > CANVAS_W || sy + p.h < 0 || sy > CANVAS_H) return;

      // Main fill
      ctx.fillStyle = COLORS.platform;
      ctx.fillRect(sx, sy, p.w, p.h);

      if (!p.isCeiling && !p.isGround) {
        // Rough top edge
        ctx.fillStyle = COLORS.platformTop;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        let px = sx;
        while (px < sx + p.w) {
          const step = 6 + Math.sin(px * 0.4) * 3;
          const jitter = Math.sin(px * 0.7 + p.y * 0.3) * 3;
          ctx.lineTo(px + step, sy + jitter);
          px += step;
        }
        ctx.lineTo(sx + p.w, sy);
        ctx.closePath();
        ctx.fill();
      }

      if (p.isCeiling) {
        // jagged bottom edge for ceiling
        ctx.fillStyle = COLORS.cave;
        ctx.beginPath();
        ctx.moveTo(sx, sy + p.h);
        let px2 = sx;
        while (px2 < sx + p.w) {
          const step = 8 + Math.cos(px2 * 0.3) * 3;
          const jitter = Math.abs(Math.sin(px2 * 0.5 + 1.2)) * 6;
          ctx.lineTo(px2 + step, sy + p.h + jitter);
          px2 += step;
        }
        ctx.lineTo(sx + p.w, sy + p.h);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  drawStalactites(stalactites: StalactiteData[], camX: number, camY: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.stalactite;
    stalactites.forEach((s) => {
      const sx = s.x - camX;
      const sy = s.y - camY;
      if (sx < -30 || sx > CANVAS_W + 30) return;
      ctx.beginPath();
      ctx.moveTo(sx - s.w / 2, sy);
      ctx.lineTo(sx + s.w / 2, sy);
      ctx.lineTo(sx, sy + s.h);
      ctx.closePath();
      ctx.fill();
    });
  }

  drawExit(exitX: number, camX: number, camY: number, levelNum: number): void {
    const ctx = this.ctx;
    const sx = exitX - camX;
    const sy = LEVEL_HEIGHT - 30 - camY;
    const glow = (Math.sin(this.crystalPulse * 3) + 1) * 0.5;

    ctx.save();
    ctx.shadowColor = COLORS.exitGlow;
    ctx.shadowBlur = 20 + glow * 15;
    ctx.fillStyle = `rgba(0,60,200,${0.3 + glow * 0.2})`;
    ctx.fillRect(sx, sy, 80, 30);

    ctx.strokeStyle = COLORS.exitGlow;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, 80, 30);

    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.textMain;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DESCEND", sx + 40, sy + 18);
    ctx.restore();
  }

  drawCheckpointMarker(x: number, y: number, camX: number, camY: number, reached: boolean): void {
    const ctx = this.ctx;
    const sx = x - camX;
    const sy = y - camY;
    const color = reached ? "#44ff88" : "#888866";

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = reached ? 10 : 4;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 20);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 20);
    ctx.lineTo(sx + 14, sy - 13);
    ctx.lineTo(sx, sy - 6);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawFog(camX: number, camY: number, levelNum: number): void {
    const ctx = this.ctx;
    const depth = Math.min(levelNum / 20, 1);
    const fogAlpha = 0.04 + depth * 0.06;

    // Rolling fog strips
    for (let i = 0; i < 4; i++) {
      const fogX = ((i * 300 + this.fogShift * 80 - camX * 0.05) % (CANVAS_W + 200)) - 100;
      const fogY = CANVAS_H * 0.4 + i * 30;
      const grad = ctx.createLinearGradient(fogX, fogY, fogX + 250, fogY + 40);
      grad.addColorStop(0, `rgba(20,20,40,0)`);
      grad.addColorStop(0.5, `rgba(20,20,40,${fogAlpha})`);
      grad.addColorStop(1, `rgba(20,20,40,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(fogX, fogY, 250, 40);
    }

    // Vignette
    const vign = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.25,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.8
    );
    vign.addColorStop(0, "rgba(0,0,0,0)");
    vign.addColorStop(1, `rgba(0,0,0,${0.35 + depth * 0.2})`);
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  drawFlashEffect(alpha: number, color = "#ffffff"): void {
    this.ctx.fillStyle = color.replace(")", `,${alpha})`).replace("rgb", "rgba");
    if (!color.startsWith("rgb")) {
      this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    }
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}
