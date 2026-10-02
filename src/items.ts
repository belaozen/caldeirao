import type { Point, Item } from "./types";
import { CORRUPT_CHANCE, CORRUPT_TYPE, MIN_ITEMS, RULES } from "./config";
import { mixKey, recipeOf } from "./recipes";
import { game } from "./state";
import { closedGates } from "./arenas";
import { available } from "./progression";
import { overlaps } from "./geometry";

export function randomIngredientType(chance = CORRUPT_CHANCE) {
  return Math.random() < chance ? CORRUPT_TYPE : Math.floor(Math.random() * 3);
}
export function randomSpawn(required = false) {
  if (game.items.length >= RULES.maxItems) return false;
  const clear = (s: Point) =>
    !game.items.some((i) => Math.hypot(i.x - s.x, i.y - s.y) < 30) &&
    ![...game.masonry, ...game.walls, ...closedGates()].some((b) => overlaps(s.x - 11, s.y - 11, 22, 22, b));
  const away = (s: Point) => !game.players.some((p) => !p.dead && Math.hypot(p.x - s.x, p.y - s.y) < 45);
  let free = game.spawnSites.filter((s) => clear(s) && away(s));
  if (!free.length && required) {
    const fallback = [];
    for (const p of game.platforms.filter((b) => !b.star))
      for (let x = p.x + 22; x < p.x + p.w - 20; x += 35) fallback.push({ x, y: p.y - 19 });
    free = fallback.filter((s) => clear(s) && away(s));
    if (!free.length) free = fallback.filter(clear);
    if (!free.length) {
      for (let y = 210; y < 490; y += 35)
        for (let x = 25; x < 940; x += 35) {
          const s = { x, y };
          if (clear(s) && !game.platforms.some((b) => overlaps(x - 11, y - 11, 22, 22, b))) free.push(s);
        }
    }
  }
  if (!free.length) return false;
  const s = free[Math.floor(Math.random() * free.length)];
  game.items.push({
    ...s,
    site: game.spawnSites.indexOf(s),
    t: randomIngredientType(),
    life: 12 + Math.random() * 6,
  });
  return true;
}
export function ensureMinimumItems() {
  while (game.items.length < MIN_ITEMS) {
    if (!randomSpawn(true)) break;
  }
  const p = game.players[0];
  if (
    game.mode === "horde" &&
    p?.bag.length === 1 &&
    p.potions.length < 3 &&
    game.items.length &&
    !game.items.some((i) => available(mixKey(p.bag[0], i.t)))
  )
    game.items.reduce((a, b) =>
      Math.hypot(a.x - p.x, a.y - p.y) > Math.hypot(b.x - p.x, b.y - p.y) ? a : b,
    ).t = p.bag[0];
}
export function previewRecipe(item: Item, p = game.players[0]) {
  if (item.t === CORRUPT_TYPE) return null;
  if (p.bag.length !== 1 || p.potions.length >= 3) return null;
  const key = mixKey(p.bag[0], item.t);
  return available(key) ? recipeOf(key) : { icon: "🔒", color: "#85909d" };
}
