import { Input } from "./Input.js";
import { GameState } from "./types.js";

/**
 * Virtual gamepad for touch / mobile devices.
 *
 * Layout (portrait & landscape):
 *
 *   ┌──────────────────────────────────────────────────┐
 *   │                   GAME CANVAS                    │
 *   │                                                  │
 *   │  [←]  [→]      [TRADE?]      [🔥]  [JUMP]       │
 *   └──────────────────────────────────────────────────┘
 *
 * Shop overlay:
 *   [◀ PREV]    [BUY]    [NEXT ▶]    [✕ CLOSE]
 *
 * Menu / Game Over:
 *   Full-width [▶ PLAY] / [↺ RESTART] tap target
 */

interface VirtualButton {
  code: string;          // key code injected into Input
  el: HTMLButtonElement;
}

export class TouchControls {
  private container: HTMLDivElement;
  private input: Input;
  private buttons: VirtualButton[] = [];
  private tradeBtn!: HTMLButtonElement;
  private visible = false;

  // groups shown per state
  private playButtons: HTMLButtonElement[] = [];
  private shopButtons: HTMLButtonElement[] = [];
  private menuButtons: HTMLButtonElement[] = [];

  constructor(input: Input, parent: HTMLElement) {
    this.input = input;
    this.container = document.createElement("div");
    this.container.id = "touch-overlay";
    Object.assign(this.container.style, {
      position:      "fixed",
      inset:         "0",
      pointerEvents: "none",
      zIndex:        "10",
      userSelect:    "none",
      WebkitUserSelect: "none",
    });
    parent.appendChild(this.container);

    this.buildCSS();
    this.buildPlayButtons();
    this.buildShopButtons();
    this.buildMenuButtons();
    this.setState(GameState.MENU, false);
  }

  // ── CSS injected once ────────────────────────────────────────────────────

  private buildCSS(): void {
    const style = document.createElement("style");
    style.textContent = `
      .vbtn {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255,255,255,0.18);
        border-radius: 12px;
        background: rgba(10,8,24,0.72);
        color: rgba(220,215,255,0.9);
        font-family: monospace;
        font-size: clamp(13px, 3.5vw, 20px);
        font-weight: bold;
        pointer-events: auto;
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
        transition: background 0.07s, border-color 0.07s;
        box-shadow: 0 2px 12px rgba(0,0,0,0.5);
        min-width: 56px;
        min-height: 56px;
      }
      .vbtn:active, .vbtn.active {
        background: rgba(60,40,100,0.85);
        border-color: rgba(160,120,255,0.7);
      }
      .vbtn-left   { bottom: 14%; left: 3%; width: 14%; max-width: 72px; height: 13%; max-height: 68px; }
      .vbtn-right  { bottom: 14%; left: calc(3% + 16%); width: 14%; max-width: 72px; height: 13%; max-height: 68px; }
      .vbtn-fire   { bottom: 14%; right: calc(3% + 17%); width: 14%; max-width: 72px; height: 13%; max-height: 68px; border-color: rgba(255,80,0,0.35); }
      .vbtn-jump   { bottom: 14%; right: 3%; width: 14%; max-width: 72px; height: 13%; max-height: 68px; border-color: rgba(80,160,255,0.35); }
      .vbtn-trade  { bottom: 14%; left: 50%; transform: translateX(-50%); width: 18%; max-width: 90px; height: 10%; max-height: 52px; font-size: clamp(10px, 2.5vw, 14px); }

      /* Shop buttons */
      .vbtn-sprev  { bottom: 10%; left: 3%; width: 20%; max-width: 100px; height: 12%; max-height: 60px; }
      .vbtn-snext  { bottom: 10%; right: 24%; width: 20%; max-width: 100px; height: 12%; max-height: 60px; }
      .vbtn-sbuy   { bottom: 10%; left: 50%; transform: translateX(-50%); width: 22%; max-width: 110px; height: 12%; max-height: 60px; border-color: rgba(255,200,0,0.5); color: #ffd700; }
      .vbtn-sclose { bottom: 10%; right: 3%; width: 18%; max-width: 90px; height: 12%; max-height: 60px; border-color: rgba(255,80,80,0.4); color: #ff8888; }

      /* Menu / game-over buttons */
      .vbtn-confirm {
        bottom: 8%;
        left: 50%;
        transform: translateX(-50%);
        width: 55%;
        max-width: 320px;
        height: 10%;
        max-height: 64px;
        font-size: clamp(14px, 4vw, 22px);
        border-color: rgba(120,100,255,0.6);
      }
    `;
    document.head.appendChild(style);
  }

  // ── Button factories ─────────────────────────────────────────────────────

  private makeBtn(label: string, cls: string): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = `vbtn ${cls}`;
    btn.textContent = label;
    btn.setAttribute("aria-label", label);
    this.container.appendChild(btn);
    return btn;
  }

  private bindHold(btn: HTMLButtonElement, code: string): void {
    const start = (e: Event) => {
      e.preventDefault();
      btn.classList.add("active");
      this.input.touchPress(code);
    };
    const end = (e: Event) => {
      e.preventDefault();
      btn.classList.remove("active");
      this.input.touchRelease(code);
    };
    btn.addEventListener("touchstart", start, { passive: false });
    btn.addEventListener("touchend", end, { passive: false });
    btn.addEventListener("touchcancel", end, { passive: false });
    // mouse fallback for dev on desktop
    btn.addEventListener("mousedown", start);
    btn.addEventListener("mouseup", end);
    btn.addEventListener("mouseleave", end);
    this.buttons.push({ code, el: btn });
  }

  private bindTap(btn: HTMLButtonElement, code: string): void {
    const tap = (e: Event) => {
      e.preventDefault();
      btn.classList.add("active");
      this.input.touchPress(code);
      // release after next frame so pressed() fires once
      requestAnimationFrame(() => {
        this.input.touchRelease(code);
        btn.classList.remove("active");
      });
    };
    btn.addEventListener("touchstart", tap, { passive: false });
    btn.addEventListener("mousedown", tap);
    this.buttons.push({ code, el: btn });
  }

  // ── Build button groups ──────────────────────────────────────────────────

  private buildPlayButtons(): void {
    const left  = this.makeBtn("◀", "vbtn-left");
    const right = this.makeBtn("▶", "vbtn-right");
    const fire  = this.makeBtn("🔥", "vbtn-fire");
    const jump  = this.makeBtn("↑", "vbtn-jump");
    this.tradeBtn = this.makeBtn("TRADE", "vbtn-trade");

    this.bindHold(left,  "ArrowLeft");
    this.bindHold(right, "ArrowRight");
    this.bindTap(fire,   "KeyF");
    this.bindTap(jump,   "Space");
    this.bindTap(this.tradeBtn, "KeyE");

    this.playButtons = [left, right, fire, jump, this.tradeBtn];
  }

  private buildShopButtons(): void {
    const prev  = this.makeBtn("◀ PREV", "vbtn-sprev");
    const next  = this.makeBtn("NEXT ▶", "vbtn-snext");
    const buy   = this.makeBtn("✓ BUY",  "vbtn-sbuy");
    const close = this.makeBtn("✕",      "vbtn-sclose");

    this.bindTap(prev,  "ArrowLeft");
    this.bindTap(next,  "ArrowRight");
    this.bindTap(buy,   "Space");
    this.bindTap(close, "KeyE");

    this.shopButtons = [prev, next, buy, close];
  }

  private buildMenuButtons(): void {
    const btn = this.makeBtn("▶  PLAY", "vbtn-confirm");
    this.bindTap(btn, "Space");
    this.menuButtons = [btn];
  }

  // ── State management ─────────────────────────────────────────────────────

  setState(state: GameState, nearMerchant: boolean): void {
    const hide = (els: HTMLButtonElement[]) =>
      els.forEach((el) => (el.style.display = "none"));
    const show = (els: HTMLButtonElement[]) =>
      els.forEach((el) => (el.style.display = "flex"));

    hide(this.playButtons);
    hide(this.shopButtons);
    hide(this.menuButtons);

    switch (state) {
      case GameState.PLAYING:
      case GameState.BOSS:
        show(this.playButtons);
        this.tradeBtn.style.display = nearMerchant ? "flex" : "none";
        break;
      case GameState.SHOP:
        show(this.shopButtons);
        break;
      case GameState.MENU:
      case GameState.GAME_OVER: {
        const btn = this.menuButtons[0];
        btn.textContent = state === GameState.GAME_OVER ? "↺  RESTART" : "▶  PLAY";
        show(this.menuButtons);
        break;
      }
      case GameState.PAUSED:
        // show nothing — user taps elsewhere to resume (pause toggle handled by Game)
        break;
    }
  }

  show(): void {
    this.visible = true;
    this.container.style.display = "block";
  }

  hide(): void {
    this.visible = false;
    this.container.style.display = "none";
  }
}

/** Returns true if this is a touch-capable device */
export function isTouchDevice(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
