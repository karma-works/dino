import { CANVAS_W, CANVAS_H } from "./constants.js";
import { Game } from "./Game.js";
import { TouchControls, isTouchDevice } from "./TouchControls.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const wrapper = document.getElementById("game-wrapper") as HTMLDivElement;
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// Scale canvas + wrapper to fit window while preserving aspect ratio
function resize(): void {
  const scaleX = window.innerWidth  / CANVAS_W;
  const scaleY = window.innerHeight / CANVAS_H;
  const scale  = Math.min(scaleX, scaleY);
  const w = `${CANVAS_W * scale}px`;
  const h = `${CANVAS_H * scale}px`;
  canvas.style.width  = w;
  canvas.style.height = h;
  wrapper.style.width  = w;
  wrapper.style.height = h;
}
resize();
window.addEventListener("resize", resize);

const game = new Game(canvas);

// Touch controls — only mounted on touch-capable devices
if (isTouchDevice()) {
  const touch = new TouchControls(game.getInput(), wrapper);
  touch.show();

  // Sync touch button visibility with game state each frame
  let lastState = game.getState();
  let lastNear  = false;
  function syncTouch() {
    const state = game.getState();
    const near  = game.isMerchantNear();
    if (state !== lastState || near !== lastNear) {
      touch.setState(state, near);
      lastState = state;
      lastNear  = near;
    }
    requestAnimationFrame(syncTouch);
  }
  requestAnimationFrame(syncTouch);
}

game.start();
