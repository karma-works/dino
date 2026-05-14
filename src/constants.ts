export const CANVAS_W = 800;
export const CANVAS_H = 500;

export const GRAVITY = 0.55;
export const TERMINAL_VEL = 18;

export const DINO_W = 28;
export const DINO_H = 36;
export const DINO_SPEED_BASE = 4;
export const DINO_JUMP_FORCE = -13;
export const DINO_HEALTH_BASE = 3;
export const FIRE_SPEED = 9;
export const FIRE_W = 14;
export const FIRE_H = 8;

export const COMPANION_W = 18;
export const COMPANION_H = 30;
export const COMPANION_SPEED = 3.2;

export const LEVEL_WIDTH = 6400;
export const LEVEL_HEIGHT = 800;
export const PLATFORM_H = 20;

export const DEBRIS_W = 24;
export const DEBRIS_H = 28;
export const DEBRIS_WARN_MS = 1800;
export const DEBRIS_FALL_SPEED_BASE = 5;

export const TREASURE_W = 16;
export const TREASURE_H = 16;

export const MERCHANT_W = 24;
export const MERCHANT_H = 38;
export const MERCHANT_INTERACT_DIST = 60;

export const ENEMY_W = 26;
export const ENEMY_H = 22;

export const BOSS_W = 90;
export const BOSS_H = 110;

export const BOSS_LEVELS = [5, 10, 15, 20, 25, 30];

export const SHOP_ITEMS = [
  { id: "shield",       label: "Shield",          cost: 5,  desc: "Block one hit" },
  { id: "fire",         label: "Fire+",            cost: 8,  desc: "Stronger, faster fire" },
  { id: "speed",        label: "Speed+",           cost: 6,  desc: "+20% movement speed" },
  { id: "doublejump",   label: "Double Jump",      cost: 10, desc: "Unlock second jump" },
  { id: "heart",        label: "Extra Heart",      cost: 12, desc: "+1 max HP" },
  { id: "revive",       label: "Revive Companion", cost: 7,  desc: "Bring human back" },
] as const;

export type ShopItemId = typeof SHOP_ITEMS[number]["id"];

export const DEFAULT_COLORS = {
  bg0:        "#030308", // textMain 14.9:1, textDim 6.0:1
  bg1:        "#07070f",
  cave:       "#111122",
  platform:   "#1c1c30",
  platformTop:"#252540",
  stalactite: "#0e0e1e",
  crystal:    "#3030ff",
  dino:       "#1a1a28",
  dinoEye:    "#ff6600",
  companion:  "#2d2d40",
  companionEye:"#88aaff",
  fire0:      "#ff4400",
  fire1:      "#ffaa00",
  treasure:   "#ffd700",
  merchantRobe:"#1a0a2e",
  debrisColor:"#2a2a3a",
  enemyColor: "#1a0a0a",
  bossColor:  "#1a0000",
  bossEye:    "#ff3333",
  hpColor:    "#ff5533", // 6.0:1 on bg0
  textMain:   "#dddddd", // 14.9:1 on bg0
  textDim:    "#8888aa", // 6.0:1 on bg0
  exitGlow:   "#4488ff",
};

export const HIGH_CONTRAST_COLORS: typeof DEFAULT_COLORS = {
  bg0:        "#000000",
  bg1:        "#000000",
  cave:       "#000000",
  platform:   "#ffffff",
  platformTop:"#00ffff",
  stalactite: "#ffff00",
  crystal:    "#00ffff",
  dino:       "#00ffff",
  dinoEye:    "#ffffff",
  companion:  "#00ffff",
  companionEye:"#ffffff",
  fire0:      "#ffff00",
  fire1:      "#ffffff",
  treasure:   "#00ff00",
  merchantRobe:"#ffffff",
  debrisColor:"#ffff00",
  enemyColor: "#ffff00",
  bossColor:  "#ffff00",
  bossEye:    "#ffffff",
  hpColor:    "#ffffff",
  textMain:   "#ffffff",
  textDim:    "#ffffff",
  exitGlow:   "#4488ff",
};

export const COLORS = { ...DEFAULT_COLORS };

export function applyColorMode(highContrast: boolean): void {
  Object.assign(COLORS, highContrast ? HIGH_CONTRAST_COLORS : DEFAULT_COLORS);
}
