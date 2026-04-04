export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(o: Vec2): Vec2 { return new Vec2(this.x + o.x, this.y + o.y); }
  sub(o: Vec2): Vec2 { return new Vec2(this.x - o.x, this.y - o.y); }
  scale(s: number): Vec2 { return new Vec2(this.x * s, this.y * s); }
  len(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
  norm(): Vec2 {
    const l = this.len();
    return l > 0 ? new Vec2(this.x / l, this.y / l) : new Vec2(0, 0);
  }
  dist(o: Vec2): number { return this.sub(o).len(); }
  clone(): Vec2 { return new Vec2(this.x, this.y); }

  static lerp(a: Vec2, b: Vec2, t: number): Vec2 {
    return new Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}

export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
