export class Input {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();
  private justReleased: Set<string> = new Set();

  constructor() {
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);
      // prevent page scroll on game keys
      if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
      this.justReleased.add(e.code);
    });
  }

  isDown(code: string): boolean { return this.keys.has(code); }

  pressed(code: string): boolean { return this.justPressed.has(code); }

  left(): boolean  { return this.isDown("ArrowLeft")  || this.isDown("KeyA"); }
  right(): boolean { return this.isDown("ArrowRight") || this.isDown("KeyD"); }
  jump(): boolean  { return this.pressed("Space") || this.pressed("ArrowUp") || this.pressed("KeyW"); }
  jumpHeld(): boolean { return this.isDown("Space") || this.isDown("ArrowUp") || this.isDown("KeyW"); }
  fire(): boolean  { return this.pressed("KeyF") || this.pressed("KeyZ"); }
  interact(): boolean { return this.pressed("KeyE"); }
  pause(): boolean { return this.pressed("Escape"); }
  mute(): boolean  { return this.pressed("KeyM"); }
  confirm(): boolean { return this.pressed("Space") || this.pressed("Enter"); }

  flush(): void {
    this.justPressed.clear();
    this.justReleased.clear();
  }
}
