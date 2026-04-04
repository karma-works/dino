import { CANVAS_W, CANVAS_H } from "./constants.js";
import { Game } from "./Game.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// Scale canvas to fit window while preserving aspect ratio
function resize(): void {
  const scaleX = window.innerWidth / CANVAS_W;
  const scaleY = window.innerHeight / CANVAS_H;
  const scale = Math.min(scaleX, scaleY);
  canvas.style.width = `${CANVAS_W * scale}px`;
  canvas.style.height = `${CANVAS_H * scale}px`;
}
resize();
window.addEventListener("resize", resize);

const game = new Game(canvas);
game.start();
