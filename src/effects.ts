import type { Point } from "./types";
import { game } from "./state";

export function burst(x: number, y: number, color: string, n = 15) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      s = 30 + Math.random() * 150;
    game.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      color,
      life: 0.4 + Math.random() * 0.4,
    });
  }
}
export function float(p: Point & { color: string }, s: string, color = p.color) {
  game.texts.push({ x: p.x, y: p.y - 40, s, color, life: 1.5 });
}
