import type { EventType } from "./types";
import { CORRUPT_RAIN_CHANCE, EVENT_INTERVAL, EVENT_TYPES, EVENT_WARNING, H, W } from "./config";
import { game } from "./state";
import { closedGates } from "./arenas";
import { beep, sfx } from "./audio";
import { overlaps } from "./geometry";
import { randomIngredientType } from "./items";
import { hit } from "./combat";

export function startArenaEvent(type: EventType) {
  game.arenaEvent.phase = "active";
  game.arenaEvent.type = type;
  game.arenaEvent.pending = null;
  game.arenaEvent.remaining = EVENT_TYPES[type].duration;
  game.arenaEvent.last = type;
  game.arenaEvent.spawnClock = 0;
  beep(type === "rain" ? 850 : 150);
}
export function spawnRainItem() {
  if (game.arenaId !== "classic") {
    if (game.items.length >= 8) return;
    const spots = [];
    for (let x = 30; x < 930; x += 30)
      for (const y of [65, 315])
        if (
          ![...game.platforms, ...game.masonry, ...game.walls, ...closedGates()].some((b) =>
            overlaps(x - 10, y - 10, 20, 30, b),
          ) &&
          !game.items.some((i) => Math.hypot(i.x - x, i.y - y) < 30)
        )
          spots.push({ x, y });
    if (spots.length)
      game.items.push({
        ...spots[Math.floor(Math.random() * spots.length)],
        t: randomIngredientType(CORRUPT_RAIN_CHANCE),
        life: 16,
        falling: true,
        vy: 35,
      });
    return;
  }
  if (game.items.length >= 8) return;
  const candidates = [];
  for (const [lo, hi] of [
    [45, 125],
    [285, 390],
    [570, 675],
    [835, 915],
  ])
    for (let x = lo; x <= hi; x += 20)
      if (
        !game.items.some((i) => Math.hypot(i.x - x, i.y - 16) < 30) &&
        ![...game.masonry, ...game.walls, ...closedGates()].some((b) => overlaps(x - 10, 5, 20, 25, b))
      )
        candidates.push(x);
  if (!candidates.length) return;
  game.items.push({
    x: candidates[Math.floor(Math.random() * candidates.length)],
    y: 16,
    t: randomIngredientType(CORRUPT_RAIN_CHANCE),
    life: 16,
    falling: true,
    vy: 35,
  });
}
export function updateArenaEvent(dt: number) {
  game.arenaEvent.remaining -= dt;
  if (game.arenaEvent.phase === "countdown") {
    if (game.arenaEvent.remaining <= EVENT_WARNING && !game.arenaEvent.pending) {
      const choices = (Object.keys(EVENT_TYPES) as EventType[]).filter(
        (type) => type !== game.arenaEvent.last,
      );
      game.arenaEvent.pending = choices[Math.floor(Math.random() * choices.length)];
      sfx("warning");
    }
    if (game.arenaEvent.remaining <= 0) startArenaEvent(game.arenaEvent.pending!);
  } else {
    if (game.arenaEvent.remaining <= 0) {
      game.arenaEvent.phase = "countdown";
      game.arenaEvent.remaining = EVENT_INTERVAL;
      game.arenaEvent.type = null;
      game.arenaEvent.pending = null;
      return;
    }
    if (game.arenaEvent.type === "rain") {
      game.arenaEvent.spawnClock -= dt;
      if (game.arenaEvent.spawnClock <= 0) {
        spawnRainItem();
        game.arenaEvent.spawnClock = 0.45;
      }
    }
  }
}
export function updateFallingItems(dt: number) {
  for (const item of game.items) {
    if (!item.falling) continue;
    const oldY = item.y;
    item.vy = (item.vy ?? 0) + 600 * dt;
    item.y += item.vy * dt;
    const floors = [...game.platforms, ...game.masonry, ...game.walls, ...closedGates()]
      .filter((b) => item.x + 7 > b.x && item.x - 7 < b.x + b.w && oldY + 19 <= b.y && item.y + 19 >= b.y)
      .sort((a, b) => a.y - b.y);
    if (floors.length) {
      item.y = floors[0].y - 19;
      item.falling = false;
      item.vy = 0;
    } else if (item.y > H + 15) item.life = 0;
  }
}
export function applyArenaHazards() {
  if (game.arenaEvent.phase !== "active") return;
  for (const p of game.players) {
    if (p.dead) continue;
    const lava =
      game.arenaEvent.type === "lava" &&
      p.y + 18 >= 480 &&
      p.y - 22 < H &&
      [...game.platforms, ...game.masonry].some((b) => b.y >= 500 && p.x + 12 > b.x && p.x - 12 < b.x + b.w);
    const laser = game.arenaEvent.type === "lasers" && (p.x - 12 < 38 || p.x + 12 > W - 38);
    if (lava || laser) hit(p, game.mode === "horde" ? -1 : 1 - p.id, laser ? 2 : 1, { reflected: true });
  }
}
