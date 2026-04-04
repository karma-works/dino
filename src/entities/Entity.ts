import { Platform } from "../types.js";
import { GRAVITY, TERMINAL_VEL } from "../constants.js";

export abstract class Entity {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  w: number;
  h: number;
  onGround = false;
  dead = false;
  facingRight = true;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x; this.y = y; this.w = w; this.h = h;
  }

  applyGravity(): void {
    this.vy = Math.min(this.vy + GRAVITY, TERMINAL_VEL);
  }

  moveAndCollide(platforms: Platform[]): void {
    this.x += this.vx;
    // horizontal collision
    for (const p of platforms) {
      if (this.overlaps(p)) {
        if (this.vx > 0) this.x = p.x - this.w;
        else if (this.vx < 0) this.x = p.x + p.w;
        this.vx = 0;
      }
    }

    this.onGround = false;
    this.y += this.vy;
    for (const p of platforms) {
      if (this.overlaps(p)) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.onGround = true;
        } else if (this.vy < 0) {
          this.y = p.y + p.h;
        }
        this.vy = 0;
      }
    }
  }

  overlaps(r: { x: number; y: number; w: number; h: number }): boolean {
    return this.x < r.x + r.w && this.x + this.w > r.x &&
           this.y < r.y + r.h && this.y + this.h > r.y;
  }

  overlapsEntity(e: Entity): boolean {
    return this.overlaps({ x: e.x, y: e.y, w: e.w, h: e.h });
  }

  centerX(): number { return this.x + this.w / 2; }
  centerY(): number { return this.y + this.h / 2; }

  abstract update(dt: number, platforms: Platform[]): void;
  abstract draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void;
}
