import { SHOP_ITEMS } from "./constants.js";
import { GameState, UpgradeState } from "./types.js";
import { Announcer } from "./Announcer.js";
import { AccessibilitySettingsState } from "./AccessibilitySettings.js";

type OverlayId = "overlay-menu" | "overlay-shop" | "overlay-pause" | "overlay-gameover";
type ShopItemId = typeof SHOP_ITEMS[number]["id"];

interface FocusCallbacks {
  start: () => void;
  resume: () => void;
  restart: () => void;
  buy: (itemId: ShopItemId) => void;
  closeShop: () => void;
  toggleMute: () => void;
  toggleSetting: (key: keyof AccessibilitySettingsState) => void;
}

export interface ShopRenderState {
  treasures: number;
  selectedIdx: number;
  upgrades: UpgradeState;
  companionAlive: boolean;
}

export class FocusManager {
  private activeOverlay: HTMLElement | null = null;
  private selectedShopIdx = 0;

  constructor(
    private wrapper: HTMLElement,
    private announcer: Announcer,
    private callbacks: FocusCallbacks,
  ) {
    this.bindStaticControls();
    document.addEventListener("keydown", (event) => this.trapFocus(event));
  }

  enterState(state: GameState): void {
    this.hideAll();
    if (state === GameState.MENU) this.show("overlay-menu", "btn-start");
    if (state === GameState.SHOP) this.show("overlay-shop", this.shopItemId(this.selectedShopIdx));
    if (state === GameState.PAUSED) this.show("overlay-pause", "btn-resume");
    if (state === GameState.GAME_OVER) this.show("overlay-gameover", "btn-restart");
    if (state === GameState.PLAYING || state === GameState.LEVEL_WIN) this.wrapper.focus();
  }

  updateMenu(highScore: number, depthRecord: number): void {
    const record = document.getElementById("menu-record");
    if (record) record.textContent = `Best: Depth ${depthRecord} | Score: ${highScore}`;
  }

  updatePause(muted: boolean, settings: AccessibilitySettingsState): void {
    setButtonText("btn-mute", `Mute: ${muted ? "On" : "Off"}`);
    setButtonText("btn-high-contrast", `High Contrast: ${settings.highContrast ? "On" : "Off"}`);
    setButtonText("btn-reduced-motion", `Reduced Motion: ${settings.reducedMotion ? "On" : "Off"}`);
    setButtonText("btn-large-hud", `Large HUD: ${settings.largeHUD ? "On" : "Off"}`);
  }

  updateGameOver(score: number, levelNum: number, highScore: number, depthRecord: number): void {
    const stats = document.getElementById("gameover-stats");
    if (!stats) return;
    const record = score > highScore || levelNum > depthRecord ? " New record." : ` Best: Depth ${depthRecord} | Score: ${highScore}.`;
    stats.textContent = `Depth reached: ${levelNum}. Score: ${score}.${record}`;
  }

  updateShop(state: ShopRenderState): void {
    this.selectedShopIdx = state.selectedIdx;
    const balance = document.getElementById("shop-balance");
    if (balance) balance.textContent = String(state.treasures);

    const list = document.getElementById("shop-list");
    if (!list) return;
    list.textContent = "";
    SHOP_ITEMS.forEach((item, idx) => {
      const maxed = isItemMaxed(item.id, state.upgrades, state.companionAlive);
      const disabled = maxed || state.treasures < item.cost;
      const option = document.createElement("li");
      option.id = this.shopItemId(idx);
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(idx === state.selectedIdx));
      option.setAttribute("aria-disabled", String(disabled));
      option.tabIndex = idx === state.selectedIdx ? 0 : -1;
      option.setAttribute("aria-label", `${item.label}. ${item.desc}. ${maxed ? "Owned" : `Cost: ${item.cost} gems`}.`);
      option.innerHTML = `<span class="item-name"></span><span class="item-desc"></span><span class="item-cost"></span>`;
      option.querySelector(".item-name")!.textContent = item.label;
      option.querySelector(".item-desc")!.textContent = item.desc;
      option.querySelector(".item-cost")!.textContent = maxed ? "Owned" : `Cost: ${item.cost}`;
      option.addEventListener("focus", () => {
        this.selectedShopIdx = idx;
        this.announceShopItem(idx, state);
      });
      option.addEventListener("click", () => this.callbacks.buy(item.id));
      list.appendChild(option);
    });
    if (this.activeOverlay?.id === "overlay-shop") {
      requestAnimationFrame(() => document.getElementById(this.shopItemId(state.selectedIdx))?.focus());
    }
  }

  focusShopItem(idx: number, state: ShopRenderState): void {
    this.selectedShopIdx = idx;
    this.updateShop({ ...state, selectedIdx: idx });
    document.getElementById(this.shopItemId(idx))?.focus();
  }

  private announceShopItem(idx: number, state: ShopRenderState): void {
    const item = SHOP_ITEMS[idx];
    if (!item) return;
    const maxed = isItemMaxed(item.id, state.upgrades, state.companionAlive);
    this.announcer.speak(`${item.label}. ${item.desc}. ${maxed ? "Owned" : `Cost ${item.cost} gems`}.`);
  }

  private show(id: OverlayId, focusId: string): void {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.setAttribute("aria-hidden", "false");
    this.activeOverlay = overlay;
    requestAnimationFrame(() => document.getElementById(focusId)?.focus());
  }

  private hideAll(): void {
    (["overlay-menu", "overlay-shop", "overlay-pause", "overlay-gameover"] as OverlayId[]).forEach((id) => {
      document.getElementById(id)?.setAttribute("aria-hidden", "true");
    });
    this.activeOverlay = null;
  }

  private trapFocus(event: KeyboardEvent): void {
    if (!this.activeOverlay) return;
    if (this.activeOverlay.id === "overlay-shop") this.handleShopKeys(event);
    if (event.key !== "Tab") return;
    const focusables = this.focusables();
    if (focusables.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const idx = Math.max(0, focusables.indexOf(current!));
    const nextIdx = event.shiftKey ? (idx - 1 + focusables.length) % focusables.length : (idx + 1) % focusables.length;
    event.preventDefault();
    focusables[nextIdx].focus();
  }

  private handleShopKeys(event: KeyboardEvent): void {
    const cols = 3;
    let next = this.selectedShopIdx;
    if (event.key === "ArrowRight") next = (next + 1) % SHOP_ITEMS.length;
    else if (event.key === "ArrowLeft") next = (next - 1 + SHOP_ITEMS.length) % SHOP_ITEMS.length;
    else if (event.key === "ArrowDown") next = Math.min(next + cols, SHOP_ITEMS.length - 1);
    else if (event.key === "ArrowUp") next = Math.max(next - cols, 0);
    else if (event.key === "Enter" || event.key === " ") this.callbacks.buy(SHOP_ITEMS[this.selectedShopIdx].id);
    else if (event.key === "Escape" || event.key.toLowerCase() === "e") this.callbacks.closeShop();
    else return;

    event.preventDefault();
    if (next !== this.selectedShopIdx) {
      this.selectedShopIdx = next;
      document.getElementById(this.shopItemId(next))?.focus();
    }
  }

  private focusables(): HTMLElement[] {
    if (!this.activeOverlay) return [];
    return Array.from(this.activeOverlay.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    )).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }

  private bindStaticControls(): void {
    document.getElementById("btn-start")?.addEventListener("click", this.callbacks.start);
    document.getElementById("btn-resume")?.addEventListener("click", this.callbacks.resume);
    document.getElementById("btn-restart")?.addEventListener("click", this.callbacks.restart);
    document.getElementById("btn-mute")?.addEventListener("click", this.callbacks.toggleMute);
    document.getElementById("btn-high-contrast")?.addEventListener("click", () => this.callbacks.toggleSetting("highContrast"));
    document.getElementById("btn-reduced-motion")?.addEventListener("click", () => this.callbacks.toggleSetting("reducedMotion"));
    document.getElementById("btn-large-hud")?.addEventListener("click", () => this.callbacks.toggleSetting("largeHUD"));
  }

  private shopItemId(idx: number): string {
    return `shop-item-${idx}`;
  }
}

function setButtonText(id: string, text: string): void {
  const button = document.getElementById(id);
  if (button) button.textContent = text;
}

function isItemMaxed(id: ShopItemId, upgrades: UpgradeState, companionAlive: boolean): boolean {
  if (id === "doublejump") return upgrades.doubleJump;
  if (id === "fire") return upgrades.fireLevel >= 3;
  if (id === "speed") return upgrades.speedLevel >= 3;
  if (id === "revive") return companionAlive;
  if (id === "heart") return upgrades.maxHearts >= 6;
  if (id === "shield") return upgrades.shieldActive;
  return false;
}
