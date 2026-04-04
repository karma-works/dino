import { Entity } from "./Entity.js";
import { Platform, EnemyType } from "../types.js";
import { ENEMY_W, ENEMY_H, COLORS } from "../constants.js";

const ENEMY_HP: Record<EnemyType, number> = { bat: 1, spider: 2, crawler: 2 };
const ENEMY_SPEED: Record<EnemyType, number> = { bat: 2.5, spider: 1.5, crawler: 1.8 };

export class Enemy extends Entity {
  readonly type: EnemyType;
  hp: number;
  private anim = 0;
  private moveTimer = 0;
  private dropY = 0;
  private dropping = false;

  constructor(x: number, y: number, type: EnemyType) {
    super(x, y, ENEMY_W, ENEMY_H);
    this.type = type;
    this.hp = ENEMY_HP[type];
    this.facingRight = Math.random() > 0.5;
    if (type === "bat") {
      this.w = 24; this.h = 14;
    } else if (type === "spider") {
      this.dropY = y;
    }
  }

  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    if (this.hp <= 0) { this.dead = true; return true; }
    return false;
  }

  update(dt: number, platforms: Platform[], playerX?: number, playerY?: number): void {
    this.anim += dt * 0.005;
    this.moveTimer += dt;

    if (this.type === "bat") this.updateBat(dt, playerX, playerY);
    else if (this.type === "spider") this.updateSpider(dt, platforms, playerX, playerY);
    else this.updateCrawler(dt, platforms);
  }

  private updateBat(dt: number, px?: number, py?: number): void {
    if (px === undefined || py === undefined) return;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 20) {
      const spd = ENEMY_SPEED.bat;
      this.x += (dx / dist) * spd;
      this.y += (dy / dist) * spd;
      this.facingRight = dx > 0;
    }
  }

  private updateSpider(dt: number, platforms: Platform[], px?: number, py?: number): void {
    // hangs at top, drops when player below
    if (!this.dropping && px !== undefined && py !== undefined) {
      const dx = Math.abs(px - this.x);
      if (dx < 30 && py > this.y) {
        this.dropping = true;
        this.vy = 3;
      }
    }
    if (this.dropping) {
      this.applyGravity();
      this.y += this.vy;
      for (const p of platforms) {
        if (this.overlaps(p) && this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.dropping = false;
          this.dropY = this.y;
          break;
        }
      }
    } else {
      // dangle
      this.y = this.dropY + Math.sin(this.anim * 2) * 3;
    }
  }

  private updateCrawler(dt: number, platforms: Platform[]): void {
    const spd = ENEMY_SPEED.crawler;
    this.vx = this.facingRight ? spd : -spd;
    this.applyGravity();
    this.moveAndCollide(platforms);
    if (this.onGround && this.moveTimer > 1200) {
      this.moveTimer = 0;
      this.facingRight = !this.facingRight;
    }
    // turn at edges
    const ahead = this.facingRight ? this.x + this.w + 4 : this.x - 4;
    const belowAhead = this.y + this.h + 4;
    let edge = true;
    for (const p of platforms) {
      if (ahead >= p.x && ahead <= p.x + p.w && belowAhead >= p.y) {
        edge = false; break;
      }
    }
    if (edge && this.onGround) this.facingRight = !this.facingRight;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    ctx.fillStyle = COLORS.enemyColor;

    if (this.type === "bat") this.drawBat(ctx, sx, sy);
    else if (this.type === "spider") this.drawSpider(ctx, sx, sy);
    else this.drawCrawler(ctx, sx, sy);

    ctx.restore();
  }

  private drawBat(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    const wingFlap = Math.sin(this.anim * 8) * 8;
    // wings
    ctx.fillStyle = "#220000";
    ctx.beginPath();
    ctx.moveTo(sx + this.w / 2, sy + this.h / 2);
    ctx.bezierCurveTo(sx, sy - wingFlap, sx - 14, sy + 4, sx - 8, sy + this.h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + this.w / 2, sy + this.h / 2);
    ctx.bezierCurveTo(sx + this.w, sy - wingFlap, sx + this.w + 14, sy + 4, sx + this.w + 8, sy + this.h);
    ctx.closePath();
    ctx.fill();
    // body
    ctx.fillStyle = COLORS.enemyColor;
    ctx.beginPath();
    ctx.ellipse(sx + this.w / 2, sy + this.h / 2, this.w / 4, this.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#ff0000";
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(sx + this.w * 0.35, sy + this.h * 0.35, 2, 0, Math.PI * 2);
    ctx.arc(sx + this.w * 0.65, sy + this.h * 0.35, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawSpider(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    // thread
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + this.w / 2, sy - 30);
    ctx.lineTo(sx + this.w / 2, sy);
    ctx.stroke();
    // body
    ctx.fillStyle = COLORS.enemyColor;
    ctx.beginPath();
    ctx.ellipse(sx + this.w / 2, sy + this.h * 0.4, this.w * 0.4, this.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + this.w / 2, sy + this.h * 0.75, this.w * 0.3, this.h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.strokeStyle = "#1a0000";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const legAnim = Math.sin(this.anim * 4 + i) * 5;
      const lx = sx + this.w * 0.5;
      const ly = sy + this.h * 0.4;
      const side = i < 2 ? -1 : 1;
      const angle = (i % 2 === 0 ? -0.6 : -0.2) * side;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(angle) * 12 * side + legAnim, ly + Math.sin(Math.abs(angle)) * 10);
      ctx.stroke();
    }
    // eyes
    ctx.fillStyle = "#ff0000";
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(sx + this.w * 0.35 + i * 4, sy + this.h * 0.28, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  private drawCrawler(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    const flip = !this.facingRight;
    if (flip) {
      ctx.save();
      ctx.translate(sx + this.w, sy);
      ctx.scale(-1, 1);
      ctx.translate(-this.w, 0);
    }
    const ref = flip ? 0 : sx;
    const ry = flip ? 0 : sy;
    // body
    ctx.fillStyle = COLORS.enemyColor;
    ctx.beginPath();
    ctx.roundRect(flip ? 2 : sx + 2, flip ? ry + this.h * 0.3 : sy + this.h * 0.3, this.w - 4, this.h * 0.55, 4);
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.roundRect(flip ? this.w * 0.55 : sx + this.w * 0.55, flip ? ry : sy, this.w * 0.45, this.h * 0.38, 3);
    ctx.fill();
    // claws
    ctx.strokeStyle = "#440000";
    ctx.lineWidth = 1.5;
    const legY = flip ? ry + this.h * 0.8 : sy + this.h * 0.8;
    for (let i = 0; i < 3; i++) {
      const lx2 = (flip ? 4 : sx + 4) + i * 8;
      const swing = Math.sin(this.anim * 6 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(lx2, legY - swing);
      ctx.lineTo(lx2 + 3, legY + 8 + swing);
      ctx.stroke();
    }
    // eye
    ctx.fillStyle = "#ff0000";
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(flip ? this.w * 0.85 : sx + this.w * 0.85, flip ? ry + this.h * 0.14 : sy + this.h * 0.14, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (flip) ctx.restore();
  }
}
