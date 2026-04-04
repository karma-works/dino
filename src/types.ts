export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {
  isGround?: boolean;
  isCeiling?: boolean;
}

export interface CheckpointData {
  x: number;
  y: number;
  reached: boolean;
}

export interface LevelData {
  platforms: Platform[];
  debrisSpawners: { x: number; ceilY: number }[];
  treasureSpots: { x: number; y: number; type: TreasureType }[];
  merchantX: number;
  exitX: number;
  checkpoints: CheckpointData[];
  enemySpots: { x: number; y: number; type: EnemyType }[];
  bossX?: number;
}

export type TreasureType = "gem" | "artifact" | "skull";
export type EnemyType = "bat" | "spider" | "crawler";

export interface UpgradeState {
  fireLevel: number;      // 0–3
  speedLevel: number;     // 0–3
  doubleJump: boolean;
  maxHearts: number;
  shieldActive: boolean;
  shieldCooldownMs: number;
}

export enum GameState {
  MENU      = "MENU",
  PLAYING   = "PLAYING",
  SHOP      = "SHOP",
  PAUSED    = "PAUSED",
  BOSS      = "BOSS",
  LEVEL_WIN = "LEVEL_WIN",
  GAME_OVER = "GAME_OVER",
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;        // 0–1
  maxLife: number;
  size: number;
  color: string;
  gravity?: boolean;
}
