import { CANVAS_W, CANVAS_H, LEVEL_WIDTH, LEVEL_HEIGHT } from "./constants.js";

export class Camera {
  x = 0;
  y = 0;

  private targetX = 0;
  private targetY = 0;
  private shakeAmt = 0;
  private shakeDur = 0;
  private shakeTimer = 0;

  follow(entityX: number, entityY: number, entityW: number, entityH: number): void {
    this.targetX = entityX + entityW / 2 - CANVAS_W / 2;
    this.targetY = entityY + entityH / 2 - CANVAS_H * 0.45;
  }

  update(dt: number): void {
    const lerp = 0.1;
    this.x += (this.targetX - this.x) * lerp;
    this.y += (this.targetY - this.y) * lerp;

    // clamp to level bounds
    this.x = Math.max(0, Math.min(this.x, LEVEL_WIDTH - CANVAS_W));
    this.y = Math.max(0, Math.min(this.y, LEVEL_HEIGHT - CANVAS_H));

    // screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const s = (this.shakeAmt * this.shakeTimer) / this.shakeDur;
      this.x += (Math.random() * 2 - 1) * s;
      this.y += (Math.random() * 2 - 1) * s;
    }
  }

  shake(amount: number, durationMs: number): void {
    this.shakeAmt = amount;
    this.shakeDur = durationMs;
    this.shakeTimer = durationMs;
  }

  toScreen(wx: number, wy: number): { sx: number; sy: number } {
    return { sx: wx - this.x, sy: wy - this.y };
  }
}
