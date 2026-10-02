import { beforeEach, expect, test } from "vitest";
import { hero, press, release, startHorde } from "./helpers";
import { STEP } from "../src/config";
import { game } from "../src/state";
import { ARENAS } from "../src/arenaLayouts";
import { configureArena } from "../src/arenas";
import { overlaps } from "../src/geometry";
import {
  activePotion,
  beginAim,
  beginDash,
  bodyBox,
  makePlayer,
  movePlayer,
  releaseAim,
} from "../src/player";
import { queueBatch, spawnBatch } from "../src/horde";
import { startArenaEvent } from "../src/events";
import { start, update } from "../src/match";
import { draw } from "../src/render";
import { updateHUD } from "../src/hud";
import type { ArenaId, Box, Player } from "../src/types";

const ARENA_IDS: ArenaId[] = ["classic", "forest", "frost"];
const insideMasonry = (b: Box) => game.masonry.some((m) => overlaps(b.x, b.y, b.w, b.h, m));

beforeEach(startHorde);

test("space dashes toward held directions or facing, double taps and W do not dash", () => {
  press("KeyW");
  press("KeyD");
  press("Space");
  expect(hero().dashDir).toBeGreaterThan(0);
  expect(hero().dashY).toBeLessThan(0);

  Object.assign(hero(), { dashTime: 0, dashCooldown: 0, face: -1 });
  game.keys.clear();
  press("Space");
  expect(hero().dashDir).toBeLessThan(0);
  expect(hero().dashY).toBe(0);

  Object.assign(hero(), { dashTime: 0, dashCooldown: 0 });
  game.keys.clear();
  press("KeyA");
  release("KeyA");
  press("KeyA");
  expect(hero().dashTime).toBe(0);

  game.keys.clear();
  const jumps = hero().jumps;
  press("KeyW");
  expect(hero().dashTime).toBe(0);
  expect(hero().jumps).toBe(jumps + 1);

  game.keys.clear();
  hero().dashCooldown = 0;
  press("Space", { repeat: true });
  expect(hero().dashTime).toBe(0);
});

test("bare bot contact never damages hero", () => {
  spawnBatch();
  Object.assign(game.players[1], { inv: 0, x: hero().x, y: hero().y });
  update(STEP);
  expect(hero().hp).toBe(hero().maxHp);
});

test("bots collect mix and throw actual inventory", () => {
  spawnBatch();
  const bot = game.players[1];
  Object.assign(bot, { x: 220, y: 327 });
  game.items = [
    { x: 220, y: 327, t: 0, life: 10 },
    { x: 220, y: 327, t: 0, life: 10 },
  ];
  update(STEP);
  expect(activePotion(bot)).toBe("00");
  bot.angle = -0.4;
  beginAim(bot);
  releaseAim(bot);
  expect(game.shots).toHaveLength(1);
  expect(game.shots[0].owner).toBe(1);
  expect(bot.potions).toHaveLength(0);
});

test("all layouts have legal spawns items stars return points", () => {
  for (const id of ARENA_IDS) {
    configureArena(id);
    start();
    expect(game.spawnSites.length).toBeGreaterThanOrEqual(6);
    expect(game.players.some((p) => insideMasonry(bodyBox(p)))).toBe(false);
    expect(game.stars.some((s) => insideMasonry({ x: s.x - 8, y: s.y - 8, w: 16, h: 16 }))).toBe(false);
    const q: Player = makePlayer(0);
    q.x = ARENAS[id].returnX;
    q.y = ARENAS[id].returnY ?? 23;
    expect(insideMasonry(bodyBox(q))).toBe(false);
    queueBatch();
    spawnBatch();
    expect(game.players).toHaveLength(1 + game.horde.groups[game.horde.batch]);
    expect(game.players.some((p) => insideMasonry(bodyBox(p)))).toBe(false);
  }
});

test("side passages work both ways including diagonal dash, solid edges block", () => {
  for (const id of ARENA_IDS) {
    configureArena(id);
    start();
    const p = hero();
    p.y = (ARENAS[id].portal[0] + ARENAS[id].portal[1]) / 2;
    p.x = 959;
    p.vx = 760;
    beginDash(p, 1, 0);
    movePlayer(p, STEP, 1);
    expect(p.x).toBeLessThan(40);

    Object.assign(p, { dashCooldown: 0, dashTime: 0, x: 1 });
    beginDash(p, -1, 0);
    movePlayer(p, STEP, -1);
    expect(p.x).toBeGreaterThan(920);

    Object.assign(p, { y: 100, x: 1, vx: -760 });
    movePlayer(p, STEP, -1);
    expect(p.x).toBeGreaterThanOrEqual(13);
    expect(p.x).toBeLessThan(40);
  }
});

test("portal will not embed character in temporary wall", () => {
  configureArena("forest");
  start();
  Object.assign(hero(), { x: 1, y: 415, vx: -760 });
  game.walls = [{ x: 920, y: 350, w: 40, h: 130, life: 10, owner: 0 }];
  movePlayer(hero(), STEP, -1);
  expect(hero().x).toBeGreaterThanOrEqual(13);
  expect(hero().x).toBeLessThan(40);
});

test("rain hazards and rendering run in all arenas", () => {
  for (const id of ARENA_IDS) {
    configureArena(id);
    start();
    for (const type of ["lava", "lasers", "rain"] as const) {
      startArenaEvent(type);
      update(STEP);
      draw();
      updateHUD();
    }
    expect(game.items.length).toBeGreaterThanOrEqual(2);
  }
});
