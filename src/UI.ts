import { CANVAS_W, CANVAS_H, SHOP_ITEMS, COLORS } from "./constants.js";
import { UpgradeState } from "./types.js";

type ShopItemId = typeof SHOP_ITEMS[number]["id"];

export class UI {
  private checkpointFlash = 0;
  private levelFlash = 0;
  private levelFlashNum = 0;
  private damageFlash = 0;

  triggerCheckpointFlash(): void { this.checkpointFlash = 1; }
  triggerLevelFlash(n: number): void { this.levelFlash = 1; this.levelFlashNum = n; }
  triggerDamageFlash(): void { this.damageFlash = 1; }

  update(dt: number): void {
    this.checkpointFlash = Math.max(0, this.checkpointFlash - dt / 800);
    this.levelFlash = Math.max(0, this.levelFlash - dt / 2000);
    this.damageFlash = Math.max(0, this.damageFlash - dt / 300);
  }

  drawHUD(
    ctx: CanvasRenderingContext2D,
    hp: number,
    maxHp: number,
    treasures: number,
    levelNum: number,
    upgrades: UpgradeState,
    companionAlive: boolean,
    depthRecord: number,
  ): void {
    ctx.save();

    // Semi-transparent HUD strip
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CANVAS_W, 38);

    // Hearts
    for (let i = 0; i < maxHp; i++) {
      const full = i < hp;
      ctx.fillStyle = full ? COLORS.hpColor : "#222";
      ctx.shadowColor = full ? COLORS.hpColor : "transparent";
      ctx.shadowBlur = full ? 6 : 0;
      drawHeart(ctx, 10 + i * 22, 8, 14);
    }
    ctx.shadowBlur = 0;

    // Treasure
    ctx.fillStyle = COLORS.treasure;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`💎 ${treasures}`, 10 + maxHp * 22 + 10, 24);

    // Level
    ctx.fillStyle = COLORS.textMain;
    ctx.textAlign = "center";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`DEPTH ${levelNum}`, CANVAS_W / 2, 24);

    // Depth record
    if (levelNum > depthRecord) {
      ctx.fillStyle = "#ffaa00";
      ctx.font = "10px monospace";
      ctx.fillText("NEW RECORD!", CANVAS_W / 2, 36);
    }

    // Companion
    ctx.textAlign = "right";
    ctx.fillStyle = companionAlive ? COLORS.companionEye : "#662222";
    ctx.font = "11px monospace";
    ctx.fillText(companionAlive ? "COMPANION: ALIVE" : "COMPANION: DEAD", CANVAS_W - 10, 16);

    // Upgrades row
    if (upgrades.doubleJump) {
      ctx.fillStyle = "#8866ff";
      ctx.fillText("2x JUMP", CANVAS_W - 10, 30);
    }
    if (upgrades.shieldActive) {
      ctx.fillStyle = "#4488ff";
      ctx.textAlign = "right";
      ctx.fillText("SHIELD", CANVAS_W - 10, 30);
    }
    if (upgrades.fireLevel > 0) {
      ctx.fillStyle = COLORS.fire1;
      ctx.textAlign = "left";
      const fireLvlX = 10 + maxHp * 22 + 70;
      ctx.fillText(`FIRE+${upgrades.fireLevel}`, fireLvlX, 24);
    }

    ctx.restore();

    // Checkpoint flash
    if (this.checkpointFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(100,255,150,${this.checkpointFlash * 0.3})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = `rgba(100,255,150,${this.checkpointFlash * 0.9})`;
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CHECKPOINT", CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.restore();
    }

    // Damage flash
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(180,0,0,${this.damageFlash * 0.25})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Level flash
    if (this.levelFlash > 0) {
      const a = Math.min(1, this.levelFlash * 3);
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${a * 0.7})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = `rgba(200,200,255,${a})`;
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.shadowColor = "#4444ff";
      ctx.shadowBlur = 20;
      ctx.fillText(`DEPTH ${this.levelFlashNum}`, CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.shadowBlur = 0;
      ctx.font = "14px monospace";
      ctx.fillStyle = `rgba(150,150,200,${a * 0.8})`;
      ctx.fillText("DESCENDING DEEPER...", CANVAS_W / 2, CANVAS_H / 2 + 16);
      ctx.restore();
    }
  }

  drawMenu(ctx: CanvasRenderingContext2D, highScore: number, deepestLevel: number): void {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.92)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Title
    ctx.textAlign = "center";
    ctx.shadowColor = COLORS.dinoEye;
    ctx.shadowBlur = 30;
    ctx.fillStyle = COLORS.dinoEye;
    ctx.font = "bold 72px monospace";
    ctx.fillText("DINO", CANVAS_W / 2, CANVAS_H * 0.28);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.textDim;
    ctx.font = "14px monospace";
    ctx.fillText("DESCEND INTO DARKNESS", CANVAS_W / 2, CANVAS_H * 0.38);

    ctx.fillStyle = "#333355";
    ctx.fillRect(CANVAS_W * 0.25, CANVAS_H * 0.44, CANVAS_W * 0.5, 1);

    ctx.fillStyle = COLORS.textMain;
    ctx.font = "12px monospace";
    ctx.fillText("Controls:", CANVAS_W / 2, CANVAS_H * 0.5);
    const controls = [
      "A/D or ←/→   Move",
      "W/↑/Space     Jump",
      "F / Z          Spit Fire",
      "E              Talk to Merchant",
      "M              Mute / Unmute",
    ];
    controls.forEach((line, i) => {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = "11px monospace";
      ctx.fillText(line, CANVAS_W / 2, CANVAS_H * 0.57 + i * 18);
    });

    if (deepestLevel > 0) {
      ctx.fillStyle = "#ffaa00";
      ctx.font = "12px monospace";
      ctx.fillText(`Best: Depth ${deepestLevel} | Score: ${highScore}`, CANVAS_W / 2, CANVAS_H * 0.86);
    }

    const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
    ctx.fillStyle = `rgba(220,220,255,${0.6 + pulse * 0.4})`;
    ctx.font = "bold 14px monospace";
    ctx.fillText("PRESS SPACE TO BEGIN", CANVAS_W / 2, CANVAS_H * 0.92);

    ctx.restore();
  }

  drawGameOver(
    ctx: CanvasRenderingContext2D,
    score: number,
    levelNum: number,
    highScore: number,
    deepestLevel: number,
  ): void {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.88)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.shadowColor = "#cc0000";
    ctx.shadowBlur = 25;
    ctx.fillStyle = "#cc2200";
    ctx.textAlign = "center";
    ctx.font = "bold 48px monospace";
    ctx.fillText("YOU DIED", CANVAS_W / 2, CANVAS_H * 0.3);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.textDim;
    ctx.font = "14px monospace";
    ctx.fillText(`Depth Reached: ${levelNum}`, CANVAS_W / 2, CANVAS_H * 0.46);
    ctx.fillText(`Score: ${score}`, CANVAS_W / 2, CANVAS_H * 0.54);

    if (score > highScore || levelNum > deepestLevel) {
      ctx.fillStyle = "#ffaa00";
      ctx.fillText("NEW RECORD!", CANVAS_W / 2, CANVAS_H * 0.62);
    } else {
      ctx.fillStyle = COLORS.textDim;
      ctx.fillText(`Best: Depth ${deepestLevel} | Score: ${highScore}`, CANVAS_W / 2, CANVAS_H * 0.62);
    }

    const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
    ctx.fillStyle = `rgba(200,200,255,${0.6 + pulse * 0.4})`;
    ctx.font = "bold 14px monospace";
    ctx.fillText("PRESS SPACE TO RESTART", CANVAS_W / 2, CANVAS_H * 0.78);

    ctx.restore();
  }

  drawShop(
    ctx: CanvasRenderingContext2D,
    treasures: number,
    selectedIdx: number,
    upgrades: UpgradeState,
    companionAlive: boolean,
  ): void {
    ctx.save();
    ctx.fillStyle = "rgba(5,2,15,0.92)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.shadowColor = "#aa44ff";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#aa44ff";
    ctx.textAlign = "center";
    ctx.font = "bold 22px monospace";
    ctx.fillText("THE MERCHANT", CANVAS_W / 2, 55);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.textDim;
    ctx.font = "11px monospace";
    ctx.fillText(`Treasures: ${treasures}`, CANVAS_W / 2, 78);

    const itemW = 150;
    const itemH = 80;
    const cols = 3;
    const rows = 2;
    const startX = (CANVAS_W - cols * (itemW + 10)) / 2;
    const startY = 100;

    SHOP_ITEMS.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ix = startX + col * (itemW + 10);
      const iy = startY + row * (itemH + 10);
      const selected = i === selectedIdx;

      const canAfford = treasures >= item.cost;
      const alreadyMaxed = isItemMaxed(item.id, upgrades, companionAlive);

      ctx.fillStyle = selected ? "rgba(80,40,120,0.8)" : "rgba(20,10,40,0.8)";
      ctx.strokeStyle = selected ? "#aa44ff" : "#332255";
      ctx.lineWidth = selected ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(ix, iy, itemW, itemH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = alreadyMaxed ? COLORS.textDim : (canAfford ? COLORS.textMain : "#554444");
      ctx.textAlign = "center";
      ctx.font = "bold 13px monospace";
      ctx.fillText(item.label, ix + itemW / 2, iy + 24);

      ctx.font = "10px monospace";
      ctx.fillStyle = COLORS.textDim;
      const descLines = wrapText(item.desc, 18);
      descLines.forEach((line, li) => {
        ctx.fillText(line, ix + itemW / 2, iy + 40 + li * 14);
      });

      ctx.fillStyle = alreadyMaxed ? COLORS.textDim : (canAfford ? COLORS.treasure : "#884444");
      ctx.font = "bold 12px monospace";
      ctx.fillText(alreadyMaxed ? "OWNED" : `💎 ${item.cost}`, ix + itemW / 2, iy + 68);
    });

    ctx.fillStyle = COLORS.textDim;
    ctx.textAlign = "center";
    ctx.font = "11px monospace";
    ctx.fillText("↑↓ / ←→ Navigate   |   SPACE / Enter = Buy   |   E / Esc = Leave", CANVAS_W / 2, CANVAS_H - 18);

    ctx.restore();
  }

  drawPauseMenu(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COLORS.textMain;
    ctx.textAlign = "center";
    ctx.font = "bold 28px monospace";
    ctx.fillText("PAUSED", CANVAS_W / 2, CANVAS_H / 2 - 20);
    ctx.font = "13px monospace";
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText("Press ESC to Resume  |  M to Mute", CANVAS_W / 2, CANVAS_H / 2 + 20);
    ctx.restore();
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.beginPath();
  const s = size / 2;
  ctx.moveTo(x + s, y + size * 0.85);
  ctx.bezierCurveTo(x, y + s, x, y, x + s * 0.5, y);
  ctx.bezierCurveTo(x + s, y, x + s, y + s * 0.3, x + s, y + s * 0.3);
  ctx.bezierCurveTo(x + s, y + s * 0.3, x + s, y, x + s * 1.5, y);
  ctx.bezierCurveTo(x + size, y, x + size, y + s, x + s, y + size * 0.85);
  ctx.closePath();
  ctx.fill();
}

function isItemMaxed(id: string, upgrades: UpgradeState, companionAlive: boolean): boolean {
  if (id === "doublejump") return upgrades.doubleJump;
  if (id === "fire") return upgrades.fireLevel >= 3;
  if (id === "speed") return upgrades.speedLevel >= 3;
  if (id === "revive") return companionAlive;
  if (id === "heart") return upgrades.maxHearts >= 6;
  return false;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  words.forEach((w) => {
    if ((cur + " " + w).trim().length <= maxChars) {
      cur = (cur + " " + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  });
  if (cur) lines.push(cur);
  return lines;
}
