import {
  LevelData, Platform, TreasureType, EnemyType, CheckpointData
} from "./types.js";
import {
  LEVEL_WIDTH, LEVEL_HEIGHT, PLATFORM_H,
  DINO_W, BOSS_LEVELS
} from "./constants.js";

function rng(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function rngInt(min: number, max: number): number {
  return Math.floor(rng(min, max + 1));
}

export function generateLevel(levelNum: number): LevelData {
  const isBossLevel = BOSS_LEVELS.includes(levelNum);
  const platforms: Platform[] = [];
  const debrisSpawners: { x: number; ceilY: number }[] = [];
  const treasureSpots: { x: number; y: number; type: TreasureType }[] = [];
  const enemySpots: { x: number; y: number; type: EnemyType }[] = [];
  const checkpoints: CheckpointData[] = [];

  const ceilH = 30;
  const floorH = 30;
  const floorY = LEVEL_HEIGHT - floorH;
  const playH = LEVEL_HEIGHT - ceilH - floorH;

  // Ceiling
  platforms.push({ x: 0, y: 0, w: LEVEL_WIDTH, h: ceilH, isCeiling: true });
  // Floor
  platforms.push({ x: 0, y: floorY, w: LEVEL_WIDTH, h: floorH, isGround: true });
  // Left wall
  platforms.push({ x: -40, y: 0, w: 40, h: LEVEL_HEIGHT });
  // Right wall (exit hole: open at exitX..exitX+80)
  const exitX = LEVEL_WIDTH - 160;
  platforms.push({ x: exitX + 80, y: floorY, w: 200, h: floorH, isGround: true });

  // Generate floating platforms
  const difficulty = Math.min(levelNum / 20, 1);
  const numPlatforms = 18 + levelNum * 1.5;
  const minPlatW = Math.max(60, 140 - levelNum * 4);
  const maxPlatW = 220 - levelNum * 3;
  const minGap = 60 + levelNum * 3;
  const maxGap = 100 + levelNum * 2;

  let curX = 200;
  let curY = floorY - 100;

  for (let i = 0; i < numPlatforms && curX < exitX - 60; i++) {
    const pw = Math.max(50, rng(minPlatW, maxPlatW));
    const gap = rng(minGap, maxGap);
    curX += gap;

    const dy = rng(-90, 90);
    curY = Math.max(ceilH + 60, Math.min(floorY - 60, curY + dy));

    platforms.push({ x: curX, y: curY, w: pw, h: PLATFORM_H });

    // Treasure on platform
    if (Math.random() > 0.45) {
      const type: TreasureType =
        Math.random() > 0.85 ? "skull" :
        Math.random() > 0.6  ? "artifact" : "gem";
      treasureSpots.push({ x: curX + pw / 2 - 8, y: curY - 20, type });
    }

    // Enemy on platform
    if (i > 1 && Math.random() > 0.6) {
      let type: EnemyType = "crawler";
      if (levelNum >= 4 && Math.random() > 0.5) type = "bat";
      if (levelNum >= 6 && Math.random() > 0.6) type = "spider";
      enemySpots.push({ x: curX + pw * 0.4, y: curY - PLATFORM_H - 22, type });
    }

    curX += pw;
  }

  // Stalactites (visible decoration only via renderer)

  // Debris spawners on ceiling
  const numDebris = Math.floor(3 + levelNum * 0.8);
  for (let i = 0; i < numDebris; i++) {
    const dx = rng(200, exitX - 100);
    debrisSpawners.push({ x: dx, ceilY: ceilH });
  }

  // Checkpoints
  const cp1X = LEVEL_WIDTH * 0.33;
  const cp2X = LEVEL_WIDTH * 0.66;
  checkpoints.push({ x: cp1X, y: floorY - 60, reached: false });
  checkpoints.push({ x: cp2X, y: floorY - 60, reached: false });

  // Merchant (mid-level)
  const merchantX = LEVEL_WIDTH * 0.45;

  return {
    platforms,
    debrisSpawners,
    treasureSpots,
    merchantX,
    exitX,
    checkpoints,
    enemySpots,
    bossX: isBossLevel ? exitX - 300 : undefined,
  };
}

export interface StalactiteData {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function generateStalactites(levelNum: number): StalactiteData[] {
  const result: StalactiteData[] = [];
  const count = 20 + levelNum * 3;
  for (let i = 0; i < count; i++) {
    result.push({
      x: rng(0, LEVEL_WIDTH),
      y: 30,
      w: rng(10, 22),
      h: rng(20, 60 + levelNum * 2),
    });
  }
  return result;
}

export interface CrystalData {
  x: number; y: number; r: number; color: string;
}

const CRYSTAL_COLORS = ["#3060ff", "#2040cc", "#8040ff", "#0080ff"];

export function generateCrystals(levelNum: number): CrystalData[] {
  const result: CrystalData[] = [];
  const count = 8 + levelNum;
  for (let i = 0; i < count; i++) {
    result.push({
      x: rng(0, LEVEL_WIDTH),
      y: rng(60, LEVEL_HEIGHT - 60),
      r: rng(2, 5),
      color: CRYSTAL_COLORS[Math.floor(Math.random() * CRYSTAL_COLORS.length)],
    });
  }
  return result;
}
