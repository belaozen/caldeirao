import { beforeEach, expect, test } from "vitest";
import { hero, startHorde } from "./helpers";
import { MAX_DISPERSION_LEVEL, MAX_PLAYER_HP_LEVEL, MAX_PLAYER_SPEED_LEVEL, STEP } from "../src/config";
import { game } from "../src/state";
import { RECIPE_KEYS, recipes } from "../src/recipes";
import { available, chooseUpgrade, effectStats, offerUpgrade } from "../src/progression";
import { activePotion, autoMix, drink } from "../src/player";
import { addWall, explode, hit } from "../src/combat";
import { beginWave, spawnBatch, updateHorde } from "../src/horde";
import { previewRecipe } from "../src/items";
import { $ } from "../src/dom";
import { selectMode, start, update } from "../src/match";
import type { Item, Shot } from "../src/types";

const shot = (s: Partial<Shot>) => s as Shot;
const moveHeroToOpenStar = () => {
  const star = game.stars.find((s) => s.side === game.gate.openSide)!;
  Object.assign(hero(), { x: star.x, y: star.y });
};

beforeEach(startHorde);

test("initial unlocks reduced durations and stars restored", () => {
  expect(game.stars).toHaveLength(2);
  expect(available("00")).toBe(true);
  expect(available("12")).toBe(false);
  expect(effectStats()).toMatchObject({ freeze: 2, shield: 4, trail: 2 });
});

test("blocked mixing preserves ingredient and ensures usable supply", () => {
  hero().bag = [0];
  game.items = [
    { x: hero().x, y: hero().y, t: 1, life: 10 },
    { x: 800, y: 300, t: 2, life: 10 },
  ];
  update(STEP);
  expect(hero().bag).toHaveLength(1);
  expect(hero().potions).toHaveLength(0);
  expect(game.items.some((i) => i.t === 0)).toBe(true);
  expect(previewRecipe({ t: 1 } as Item)?.icon).toBe("🔒");
});

test("end wave pauses and offers exactly one choice then rest", () => {
  spawnBatch();
  for (const p of game.players.slice(1)) {
    p.inv = 0;
    hit(p, 0, 99, { lethal: true });
  }
  updateHorde(STEP);
  expect(game.state).toBe("upgrade");
  expect($("upgrade-dialog").open).toBe(true);
  const before = game.time;
  update(10);
  expect(game.time).toBe(before);
  chooseUpgrade("11");
  chooseUpgrade("11");
  expect(game.evolution.levels["11"]).toBe(1);
  expect(game.state).toBe("playing");
  expect(game.horde.phase).toBe("rest");
  updateHorde(4.1);
  expect(game.horde.wave).toBe(2);
  expect(game.evolution.levels["11"]).toBe(1);
});

test("unlock choice enables mixed potion without free upgrade", () => {
  offerUpgrade();
  chooseUpgrade("12");
  hero().bag = [1, 2];
  autoMix(hero());
  expect(activePotion(hero())).toBe("12");
  expect(game.evolution.levels["12"]).toBe(0);
  expect(available("12")).toBe(true);
});

test("all upgrades affect required stats", () => {
  game.evolution.unlocked = [...RECIPE_KEYS];
  for (const k of RECIPE_KEYS) {
    offerUpgrade();
    chooseUpgrade(k);
  }
  expect(effectStats()).toMatchObject({
    freeze: 3,
    shield: 6,
    wall: 6,
    poison: 3,
    poisonRadius: 55,
    heal: 2,
    radius: 75,
    burn: 3,
    width: 44,
    speed: 6,
    trail: 3,
    reflect: 6,
  });
});

test("actual potion effects use upgraded stats", () => {
  game.evolution.unlocked = [...RECIPE_KEYS];
  for (const k of RECIPE_KEYS) game.evolution.levels[k] = 2;
  hero().hp = 1;
  hero().potions = ["22"];
  drink(hero());
  expect(hero().hp).toBe(4);
  hero().potions = ["11"];
  drink(hero());
  expect(hero().shield).toBe(8);
  hero().potions = ["00"];
  drink(hero());
  expect(hero().burn).toBe(4);
  explode(shot({ x: 200, y: 300, owner: 0, r: recipes["01"] }), null);
  explode(shot({ x: 200, y: 300, owner: 0, r: recipes["22"] }), null);
  expect(game.zones[0]).toMatchObject({ w: 56 });
  expect(game.zones[1].life).toBe(3);
  addWall({ x: 200, y: 500, owner: 0 });
  expect(game.walls[0].life).toBe(8);
  spawnBatch();
  const enemy = game.players[1];
  enemy.inv = 0;
  explode(shot({ x: enemy.x, y: enemy.y, owner: 0, r: recipes["11"] }), null);
  expect(enemy.frozen).toBe(4);
});

test("two star halves grant one extra life per wave without HP heal", () => {
  hero().hp = 2;
  moveHeroToOpenStar();
  update(STEP);
  expect(game.horde.lives).toBe(3);
  expect(hero().stars).toBe(1);
  expect(hero().hp).toBe(2);
  game.gate.openSide = 1 - game.gate.openSide;
  moveHeroToOpenStar();
  update(STEP);
  expect(game.horde.lives).toBe(4);
  expect(hero().hp).toBe(2);
  update(STEP);
  expect(game.horde.lives).toBe(4);
  beginWave(2);
  expect(game.stars[0].owner).toBe(null);
  expect(game.horde.lives).toBe(4);
});

test("death preserves progression but restart clears it", () => {
  game.evolution.levels["11"] = 2;
  game.evolution.unlocked.push("12");
  hero().inv = 0;
  hit(hero(), -1, 99, { lethal: true });
  update(1.7);
  expect(game.evolution.levels["11"]).toBe(2);
  expect(available("12")).toBe(true);
  start();
  expect(game.evolution.levels["11"]).toBe(0);
  expect(available("12")).toBe(false);
});

test("max levels offer life fallback only", () => {
  game.evolution.unlocked = [...RECIPE_KEYS];
  for (const k of RECIPE_KEYS) game.evolution.levels[k] = 5;
  Object.assign(game.evolution.player, {
    speed: MAX_PLAYER_SPEED_LEVEL,
    maxHp: MAX_PLAYER_HP_LEVEL,
    dispersion: MAX_DISPERSION_LEVEL,
  });
  offerUpgrade();
  chooseUpgrade("life");
  expect(game.horde.lives).toBe(4);
  offerUpgrade();
  chooseUpgrade("11");
  expect(game.state).toBe("upgrade");
  expect(game.evolution.levels["11"]).toBe(5);
});

test("duel maintains full recipes and original stats", () => {
  selectMode("duel");
  start();
  expect(RECIPE_KEYS.every(available)).toBe(true);
  expect(effectStats()).toMatchObject({ freeze: 5, shield: 10, trail: 5 });
  expect(game.stars).toHaveLength(2);
});
