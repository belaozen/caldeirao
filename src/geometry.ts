import type { Box } from "./types";
export function shuffled<T>(list: T[]) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export function overlaps(x: number, y: number, w: number, h: number, b: Box) {
  return x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y;
}
// Slab intersection: projectiles and the preview use this exact same swept collision test.
export function segmentBox(x: number, y: number, nx: number, ny: number, b: Box, pad = 0) {
  let lo = 0,
    hi = 1;
  for (const [v, d, min, max] of [
    [x, nx - x, b.x - pad, b.x + b.w + pad],
    [y, ny - y, b.y - pad, b.y + b.h + pad],
  ]) {
    if (Math.abs(d) < 1e-8) {
      if (v < min || v > max) return null;
    } else {
      let a = (min - v) / d,
        c = (max - v) / d;
      if (a > c) [a, c] = [c, a];
      lo = Math.max(lo, a);
      hi = Math.min(hi, c);
      if (lo > hi) return null;
    }
  }
  return lo;
}
export function distanceSegment(px: number, py: number, x: number, y: number, nx: number, ny: number) {
  const dx = nx - x,
    dy = ny - y,
    l = dx * dx + dy * dy,
    t = l ? clamp(((px - x) * dx + (py - y) * dy) / l, 0, 1) : 0;
  return Math.hypot(px - x - dx * t, py - y - dy * t);
}
