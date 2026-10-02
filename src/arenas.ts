import type { Point, Platform, ArenaId, Player } from "./types";
import { GATE_PERIOD, W } from "./config";
import { $ } from "./dom";
import { ARENAS, isArenaId } from "./arenaLayouts";
import { game } from "./state";
import { clamp, overlaps } from "./geometry";
import { burst, float } from "./effects";
import { selectMode } from "./match";

export function gateBox(side: number) {
  return { ...ARENAS[game.arenaId].gates[side], gate: true };
}
export function closedGates() {
  return [gateBox(1 - game.gate.openSide)];
}
export function updateGates(dt: number) {
  game.gate.remaining -= dt;
  if (game.gate.remaining > 0) return;
  game.gate.remaining = GATE_PERIOD;
  game.gate.openSide = 1 - game.gate.openSide;
  const box = gateBox(1 - game.gate.openSide);
  for (const p of game.players) {
    if (p.dead || !overlaps(p.x - 12, p.y - 22, 24, 40, box)) continue;
    const obstacles = [...game.platforms, ...game.masonry, ...game.walls, ...closedGates()];
    let spots = [
      { x: p.x, y: box.y + box.h + 23 },
      { x: box.x - 14, y: p.y },
      { x: box.x + box.w + 14, y: p.y },
    ];
    for (let y = 140; y < 480; y += 40) for (let x = 35; x < 940; x += 40) spots.push({ x, y });
    const safe = spots.find((q) => !obstacles.some((b) => overlaps(q.x - 12, q.y - 22, 24, 40, b)));
    if (safe) {
      p.x = safe.x;
      p.y = safe.y;
      p.vx = 0;
      p.vy = 80;
      p.dashTime = 0;
      p.aiming = false;
      float(p, "Porta fechou · saída segura", "#ffe291");
    }
  }
}
export function arenaStars() {
  return ARENAS[game.arenaId].stars.map((s, side) => ({ ...s, side, owner: null }));
}
export function configureArena(id: ArenaId) {
  game.arenaId = id;
  const a = ARENAS[id];
  game.platforms = a.platforms.map((b) => ({ ...b }));
  game.masonry = a.masonry.map((b) => ({ ...b }));
  game.spawnSites = a.spawnSites ? a.spawnSites.map((b) => ({ ...b })) : arenaSpawnSites();
  $("arena-name").textContent = a.name;
  $("arena-select").value = id;
}
export function arenaSpawnSites() {
  const spots: Point[] = [];
  for (const b of [...game.platforms, ...game.masonry] as Platform[]) {
    if (b.y < 100 || b.star) continue;
    for (let x = b.x + 28; x < b.x + b.w - 24; x += 65) {
      const p = { x, y: b.y - 19 };
      if (![...game.platforms, ...game.masonry].some((q) => overlaps(x - 20, p.y - 34, 40, 52, q)))
        spots.push(p);
    }
  }
  return spots;
}
export function changeArena(id: string) {
  if (!isArenaId(id)) return;
  configureArena(id);
  selectMode(game.mode);
}
export function portalMove(p: Player, nx: number, hw: number, head: number) {
  const [top, bottom] = ARENAS[game.arenaId].portal,
    exitX = nx < 0 ? W - hw - 2 : hw + 2;
  if (p.y - head >= top && p.y + 18 <= bottom) {
    if (nx < 0 || nx > W) {
      if (
        ![...game.masonry, ...game.walls, ...closedGates(), ...game.platforms].some((b) =>
          overlaps(exitX - hw, p.y - head, hw * 2, head + 18, b),
        )
      ) {
        burst(p.x, p.y, p.color, 6);
        p.x = exitX;
        burst(p.x, p.y, p.color, 6);
        return exitX;
      }
    } else return nx;
  }
  return clamp(nx, hw + 1, W - hw - 1);
}
