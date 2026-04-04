import { Entity } from "./Entity.js";
import { Platform, TreasureType } from "../types.js";
import { TREASURE_W, TREASURE_H, COLORS } from "../constants.js";

const TREASURE_VALUES: Record<TreasureType, number> = {
  gem: 1, artifact: 3, skull: 5,
};

const TREASURE_COLORS: Record<TreasureType, string> = {
  gem: "#44ffdd",
  artifact: "#ffaa00",
  skull: "#ff4444",
};

export class Treasure extends Entity {
  readonly type: TreasureType;
  readonly value: number;
  private pulse = Math.random() * Math.PI * 2;
  collected = false;
  private floatY = 0;

  constructor(x: number, y: number, type: TreasureType) {
    super(x, y, TREASURE_W, TREASURE_H);
    this.type = type;
    this.value = TREASURE_VALUES[type];
    this.floatY = y;
  }

  update(dt: number, _platforms: Platform[]): void {
    this.pulse += dt * 0.003;
    this.y = this.floatY + Math.sin(this.pulse) * 4;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    if (this.collected) return;
    const sx = this.x - camX;
    const sy = this.y - camY;
    const color = TREASURE_COLORS[this.type];
    const glow = (Math.sin(this.pulse * 2) + 1) * 0.5;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 + glow * 12;

    if (this.type === "gem") {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(sx + this.w / 2, sy);
      ctx.lineTo(sx + this.w, sy + this.h * 0.4);
      ctx.lineTo(sx + this.w / 2, sy + this.h);
      ctx.lineTo(sx, sy + this.h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (this.type === "artifact") {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(sx + 2, sy + 2, this.w - 4, this.h - 4, 3);
      ctx.fill();
      // cross mark
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + this.w / 2, sy + 4);
      ctx.lineTo(sx + this.w / 2, sy + this.h - 4);
      ctx.moveTo(sx + 4, sy + this.h / 2);
      ctx.lineTo(sx + this.w - 4, sy + this.h / 2);
      ctx.stroke();
    } else {
      // skull
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx + this.w / 2, sy + this.h * 0.45, this.w * 0.42, 0, Math.PI * 2);
      ctx.fill();
      // eyes
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(sx + this.w * 0.32, sy + this.h * 0.38, 2.5, 0, Math.PI * 2);
      ctx.arc(sx + this.w * 0.68, sy + this.h * 0.38, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // teeth
      ctx.fillStyle = "#000";
      ctx.fillRect(sx + this.w * 0.28, sy + this.h * 0.7, 3, 4);
      ctx.fillRect(sx + this.w * 0.46, sy + this.h * 0.7, 3, 4);
      ctx.fillRect(sx + this.w * 0.64, sy + this.h * 0.7, 3, 4);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
