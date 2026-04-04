import { CANVAS_W, CANVAS_H } from "./constants.js";
import { Game } from "./Game.js";
import { TouchControls, isTouchDevice } from "./TouchControls.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// Wrapper keeps canvas and touch overlay aligned
const wrapper = document.createElement("div");
Object.assign(wrapper.style, {
  position: "relative",
  display:  "inline-block",
  lineHeight: "0",
});
canvas.parentElement!.insertBefore(wrapper, canvas);
wrapper.appendChild(canvas);

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

// Prevent default touch behaviours (scroll, zoom) on the game area
document.body.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
document.body.addEventListener("touchmove",  (e) => e.preventDefault(), { passive: false });

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
